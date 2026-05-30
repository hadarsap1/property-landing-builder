import { NextRequest, NextResponse } from 'next/server';
import { sql, hasDb } from '@/lib/db';
import { isDevStore, devStoreGet } from '@/lib/dev-store';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const code = req.nextUrl.searchParams.get('code');
  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'Missing or invalid code' }, { status: 400 });
  }

  // ── Try PostgreSQL first ───────────────────────────────────────────────────
  if (hasDb()) {
    try {
      const rows = await sql!`
        SELECT data, expires_at
        FROM projects
        WHERE code = ${code}
        LIMIT 1
      `;

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      const row = rows[0] as { data: unknown; expires_at: string | null };

      // Check expiry for anonymous projects
      if (row.expires_at && new Date(row.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Project has expired' }, { status: 404 });
      }

      return NextResponse.json({ project: row.data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[load-project] DB error:', { message });
      // Fall through to KV fallback
    }
  }

  // ── KV / filesystem fallback (dev or DB unavailable) ──────────────────────
  if (!process.env.KV_URL) {
    if (isDevStore()) {
      const project = await devStoreGet(code);
      if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      return NextResponse.json({ project });
    }
    return NextResponse.json(
      { error: 'No storage configured in development' },
      { status: 404 }
    );
  }

  try {
    const { kv } = await import('@vercel/kv');
    const data = await kv.get(`project:${code}`);
    if (!data) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    const project = typeof data === 'string' ? (JSON.parse(data) as unknown) : data;
    return NextResponse.json({ project });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[load-project] KV error:', { message });
    return NextResponse.json({ error: 'Failed to load project' }, { status: 500 });
  }
}
