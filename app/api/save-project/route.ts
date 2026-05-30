import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';
import { put } from '@vercel/blob';
import { auth } from '@/auth';
import { sql, hasDb } from '@/lib/db';
import { isDevStore, devStoreGet, devStoreSet } from '@/lib/dev-store';
import { rateLimit } from '@/lib/rate-limit';
import type { PropertyProject, PropertyStatus, StoredImage } from '@/types/project';

const MAX_BODY_BYTES = 30_000_000; // ~30 MB — generous cap for image-heavy projects

/** Sanitize a client-supplied id before using it in a storage key (no traversal). */
function safeBlobId(id: string): string {
  const clean = (id ?? '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  if (clean) return clean;
  // Fallback: two random 24-bit segments → 12 hex chars
  const a = randomInt(0, 0xffffff).toString(16).padStart(6, '0');
  const b = randomInt(0, 0xffffff).toString(16).padStart(6, '0');
  return a + b;
}

// ── Code generation ─────────────────────────────────────────────────────────────

/** Cryptographically-random 6-digit code (not Math.random — harder to enumerate). */
function generateCode(): string {
  return randomInt(100000, 1000000).toString();
}

/** Find a 6-digit code not already taken. Falls back to a random one after retries. */
async function generateUniqueCode(): Promise<string> {
  if (!hasDb()) return generateCode();
  for (let i = 0; i < 8; i++) {
    const candidate = generateCode();
    const rows = await sql!`SELECT 1 FROM projects WHERE code = ${candidate} LIMIT 1`;
    if (rows.length === 0) return candidate;
  }
  return generateCode();
}

// ── Image upload helpers ───────────────────────────────────────────────────────

async function uploadImageToBlob(
  dataUrl: string,
  filename: string
): Promise<string> {
  // dataUrl is "data:image/jpeg;base64,<data>"
  const base64 = dataUrl.split(',')[1];
  if (!base64) throw new Error('Invalid dataUrl');
  const buffer = Buffer.from(base64, 'base64');
  const blob = await put(`properties/${filename}`, buffer, {
    access: 'public',
    contentType: 'image/jpeg',
  });
  return blob.url;
}

async function uploadProjectImages(
  images: StoredImage[]
): Promise<StoredImage[]> {
  return Promise.all(
    images.map(async (img) => {
      const result: StoredImage = { ...img };

      const id = safeBlobId(img.id);

      // Upload original if not already in Blob
      if (!img.blobUrl && img.dataUrl?.startsWith('data:')) {
        try {
          result.blobUrl = await uploadImageToBlob(img.dataUrl, `${id}.jpg`);
          result.dataUrl = ''; // don't store base64 in DB
        } catch (err) {
          console.error('[save-project] original upload failed:', id, err);
        }
      }

      // Upload enhanced version if present and not already in Blob
      if (!img.enhancedBlobUrl && img.enhancedDataUrl?.startsWith('data:')) {
        try {
          result.enhancedBlobUrl = await uploadImageToBlob(
            img.enhancedDataUrl,
            `${id}-enhanced.jpg`
          );
          result.enhancedDataUrl = ''; // clear base64 after upload
        } catch (err) {
          console.error('[save-project] enhanced upload failed:', img.id, err);
        }
      }

      return result;
    })
  );
}

// ── Route handler ─────────────────────────────────────────────────────────────

interface SaveProjectBody {
  project: unknown;
  /** Present when re-saving an existing listing (update instead of create). */
  code?: unknown;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = await rateLimit(req, { name: 'save-project', limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'הפרויקט גדול מדי' }, { status: 413 });
  }

  let body: SaveProjectBody;
  try {
    body = (await req.json()) as SaveProjectBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { project } = body;
  if (!project || typeof project !== 'object') {
    return NextResponse.json({ error: 'Missing project data' }, { status: 400 });
  }
  const incoming = project as PropertyProject;

  // Re-saving an existing listing? The client passes back its 6-digit code.
  const requestedCode =
    typeof body.code === 'string' && /^\d{6}$/.test(body.code) ? body.code : null;

  // Current user (may be null for anonymous sessions)
  const session = await auth();
  const userId = session?.user?.id ?? null;

  // ── Dev mode (no Blob / DB configured) ────────────────────────────────────
  const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  if (!hasBlobToken || !hasDb()) {
    const code = requestedCode ?? (await generateUniqueCode());
    // Preserve an existing record's lifecycle status on re-save.
    let prevStatus: PropertyStatus = 'available';
    try {
      if (process.env.KV_URL) {
        const { kv } = await import('@vercel/kv');
        if (requestedCode) {
          const existing = await kv.get<unknown>(`project:${code}`);
          const parsed = (typeof existing === 'string' ? JSON.parse(existing) : existing) as PropertyProject | null;
          if (parsed?.status) prevStatus = parsed.status;
        }
        await kv.set(`project:${code}`, JSON.stringify({ ...incoming, status: prevStatus }), { ex: 60 * 60 * 24 * 90 });
      } else if (isDevStore()) {
        if (requestedCode) {
          const existing = await devStoreGet(code);
          if (existing?.status) prevStatus = existing.status;
        }
        await devStoreSet(code, { ...incoming, status: prevStatus });
      }
    } catch {
      // ignore
    }
    console.info('[save-project] Dev mode — code', code);
    return NextResponse.json({ code, updated: !!requestedCode });
  }

  // ── Production (Postgres + Blob): upload images once ───────────────────────
  let images = incoming.images ?? [];
  try {
    images = await uploadProjectImages(images);
  } catch (err) {
    console.error('[save-project] image upload batch failed:', err);
    // Continue with original images — don't block the save
  }

  // ── Update an existing listing ─────────────────────────────────────────────
  if (requestedCode) {
    try {
      const rows = await sql!`SELECT user_id, status FROM projects WHERE code = ${requestedCode} LIMIT 1`;
      if (rows.length > 0) {
        const row = rows[0] as { user_id: string | null; status: PropertyStatus };
        // Owned listings require their owner; anonymous ones are managed by code.
        if (row.user_id && row.user_id !== userId) {
          return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
        }
        const preserved: PropertyProject = { ...incoming, images, status: row.status ?? 'available' };
        await sql!`
          UPDATE projects SET
            title            = ${incoming.title ?? null},
            city             = ${incoming.city ?? null},
            neighborhood     = ${incoming.neighborhood ?? null},
            rooms            = ${incoming.rooms ?? null},
            price            = ${incoming.price ?? null},
            price_on_request = ${incoming.priceOnRequest ?? false},
            template         = ${incoming.template ?? null},
            is_published     = ${incoming.isPublished ?? false},
            data             = ${JSON.stringify(preserved)},
            updated_at       = now()
          WHERE code = ${requestedCode}
        `;
        return NextResponse.json({ code: requestedCode, updated: true });
      }
      // Code not found — fall through and create a fresh listing.
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[save-project] update error:', { message });
      return NextResponse.json({ error: 'Failed to save project' }, { status: 500 });
    }
  }

  // ── Create a new listing ───────────────────────────────────────────────────
  const code = await generateUniqueCode();
  const status: PropertyStatus = 'available'; // always available at creation
  const projectToSave: PropertyProject = { ...incoming, images, status };
  try {
    const expiresAt = userId
      ? null // permanent for registered users
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90d for anon

    await sql!`
      INSERT INTO projects (
        code, user_id, title, city, neighborhood,
        rooms, price, price_on_request, template,
        is_published, status, data, expires_at
      ) VALUES (
        ${code},
        ${userId},
        ${incoming.title ?? null},
        ${incoming.city ?? null},
        ${incoming.neighborhood ?? null},
        ${incoming.rooms ?? null},
        ${incoming.price ?? null},
        ${incoming.priceOnRequest ?? false},
        ${incoming.template ?? null},
        ${incoming.isPublished ?? false},
        ${status},
        ${JSON.stringify(projectToSave)},
        ${expiresAt}
      )
    `;

    return NextResponse.json({ code, updated: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[save-project] DB error:', { message });
    return NextResponse.json({ error: 'Failed to save project' }, { status: 500 });
  }
}
