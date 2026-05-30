import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql, hasDb } from '@/lib/db';
import { isDevStore, devStoreGet, devStoreSet } from '@/lib/dev-store';
import { rateLimit } from '@/lib/rate-limit';
import type { PropertyProject, PropertyStatus } from '@/types/project';

const VALID_STATUSES: PropertyStatus[] = ['available', 'sold', 'rented'];

function isValidStatus(v: unknown): v is PropertyStatus {
  return typeof v === 'string' && (VALID_STATUSES as string[]).includes(v);
}

// ── GET — minimal info for the /manage screen ─────────────────────────────────
export async function GET(req: NextRequest): Promise<NextResponse> {
  const code = req.nextUrl.searchParams.get('code');
  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'קוד לא תקין' }, { status: 400 });
  }

  if (hasDb()) {
    try {
      const rows = await sql!`
        SELECT title, status, data->>'listingType' AS listing_type, expires_at
        FROM projects WHERE code = ${code} LIMIT 1
      `;
      if (rows.length === 0) return NextResponse.json({ error: 'נכס לא נמצא' }, { status: 404 });
      const row = rows[0] as { title: string | null; status: string; listing_type: string | null; expires_at: string | null };
      if (row.expires_at && new Date(row.expires_at) < new Date()) {
        return NextResponse.json({ error: 'הנכס פג תוקף' }, { status: 404 });
      }
      return NextResponse.json({
        title: row.title,
        status: row.status,
        listingType: row.listing_type ?? 'sale',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[project-status] GET DB error:', { message });
      // fall through to KV
    }
  }

  const project = process.env.KV_URL
    ? await loadFromKv(code)
    : isDevStore()
    ? await devStoreGet(code)
    : null;
  if (!project) return NextResponse.json({ error: 'נכס לא נמצא' }, { status: 404 });
  return NextResponse.json({
    title: project.title,
    status: project.status ?? 'available',
    listingType: project.listingType ?? 'sale',
  });
}

// ── PATCH — update lifecycle status ───────────────────────────────────────────
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const limited = await rateLimit(req, { name: 'project-status', limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  let body: { code?: string; status?: unknown };
  try {
    body = (await req.json()) as { code?: string; status?: unknown };
  } catch {
    return NextResponse.json({ error: 'גוף בקשה לא תקין' }, { status: 400 });
  }

  const { code } = body;
  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'קוד לא תקין' }, { status: 400 });
  }
  if (!isValidStatus(body.status)) {
    return NextResponse.json({ error: 'סטטוס לא תקין' }, { status: 400 });
  }
  const status = body.status;

  // ── PostgreSQL path ─────────────────────────────────────────────────────────
  if (hasDb()) {
    try {
      const rows = await sql!`SELECT user_id FROM projects WHERE code = ${code} LIMIT 1`;
      if (rows.length === 0) return NextResponse.json({ error: 'נכס לא נמצא' }, { status: 404 });

      const ownerId = (rows[0] as { user_id: string | null }).user_id;

      // Listings tied to an account can only be changed by their owner.
      // Anonymous listings (no owner) are managed by whoever holds the code —
      // the same trust model as the share link itself.
      if (ownerId) {
        const session = await auth();
        if (session?.user?.id !== ownerId) {
          return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
        }
      }

      // Update both the column (for queries) and the JSONB (for the preview page).
      await sql!`
        UPDATE projects
        SET status = ${status},
            data = jsonb_set(data, '{status}', to_jsonb(${status}::text), true),
            updated_at = now()
        WHERE code = ${code}
      `;
      return NextResponse.json({ ok: true, status });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[project-status] PATCH DB error:', { message });
      return NextResponse.json({ error: 'עדכון הסטטוס נכשל' }, { status: 500 });
    }
  }

  // ── KV / filesystem fallback (local dev) ──────────────────────────────────────
  // Anonymous trust model applies here too (no owner concept in dev stores).
  if (process.env.KV_URL) {
    const project = await loadFromKv(code);
    if (!project) return NextResponse.json({ error: 'נכס לא נמצא' }, { status: 404 });
    try {
      const { kv } = await import('@vercel/kv');
      await kv.set(`project:${code}`, JSON.stringify({ ...project, status }), {
        ex: 60 * 60 * 24 * 90,
      });
      return NextResponse.json({ ok: true, status });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[project-status] PATCH KV error:', { message });
      return NextResponse.json({ error: 'עדכון הסטטוס נכשל' }, { status: 500 });
    }
  }

  if (isDevStore()) {
    const project = await devStoreGet(code);
    if (!project) return NextResponse.json({ error: 'נכס לא נמצא' }, { status: 404 });
    await devStoreSet(code, { ...project, status });
    return NextResponse.json({ ok: true, status });
  }

  return NextResponse.json({ error: 'אין מאגר נתונים' }, { status: 503 });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function loadFromKv(code: string): Promise<PropertyProject | null> {
  if (!process.env.KV_URL) return null;
  try {
    const { kv } = await import('@vercel/kv');
    const data = await kv.get<unknown>(`project:${code}`);
    if (!data) return null;
    return typeof data === 'string'
      ? (JSON.parse(data) as PropertyProject)
      : (data as PropertyProject);
  } catch {
    return null;
  }
}
