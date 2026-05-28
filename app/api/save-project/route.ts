import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { auth } from '@/auth';
import { sql, hasDb } from '@/lib/db';
import type { PropertyProject, StoredImage } from '@/types/project';

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

      // Upload original if not already in Blob
      if (!img.blobUrl && img.dataUrl?.startsWith('data:')) {
        try {
          result.blobUrl = await uploadImageToBlob(img.dataUrl, `${img.id}.jpg`);
          result.dataUrl = ''; // don't store base64 in DB
        } catch (err) {
          console.error('[save-project] original upload failed:', img.id, err);
        }
      }

      // Upload enhanced version if present and not already in Blob
      if (!img.enhancedBlobUrl && img.enhancedDataUrl?.startsWith('data:')) {
        try {
          result.enhancedBlobUrl = await uploadImageToBlob(
            img.enhancedDataUrl,
            `${img.id}-enhanced.jpg`
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
}

export async function POST(req: NextRequest): Promise<NextResponse> {
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

  const p = project as PropertyProject;

  // Generate a unique 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Get the current user (may be null for anonymous sessions)
  const session = await auth();
  const userId = session?.user?.id ?? null;

  // ── Dev mode (no Blob / DB configured) ────────────────────────────────────
  const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  if (!hasBlobToken || !hasDb()) {
    console.info('[save-project] Dev mode — returning mock code', code);
    // Still try the KV fallback for zero-config dev experience
    try {
      if (process.env.KV_URL) {
        const { kv } = await import('@vercel/kv');
        await kv.set(`project:${code}`, JSON.stringify(p), { ex: 60 * 60 * 24 * 90 });
      }
    } catch {
      // ignore
    }
    return NextResponse.json({ code });
  }

  // ── Upload images to Vercel Blob ───────────────────────────────────────────
  let projectToSave = p;
  try {
    const uploadedImages = await uploadProjectImages(p.images ?? []);
    projectToSave = { ...p, images: uploadedImages };
  } catch (err) {
    console.error('[save-project] image upload batch failed:', err);
    // Continue with original images — don't block the save
  }

  // ── Save to PostgreSQL ─────────────────────────────────────────────────────
  try {
    const expiresAt = userId
      ? null // permanent for registered users
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90d for anon

    await sql!`
      INSERT INTO projects (
        code, user_id, title, city, neighborhood,
        rooms, price, price_on_request, template,
        is_published, data, expires_at
      ) VALUES (
        ${code},
        ${userId},
        ${p.title ?? null},
        ${p.city ?? null},
        ${p.neighborhood ?? null},
        ${p.rooms ?? null},
        ${p.price ?? null},
        ${p.priceOnRequest ?? false},
        ${p.template ?? null},
        ${p.isPublished ?? false},
        ${JSON.stringify(projectToSave)},
        ${expiresAt}
      )
    `;

    return NextResponse.json({ code });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[save-project] DB error:', { message });
    return NextResponse.json({ error: 'Failed to save project' }, { status: 500 });
  }
}
