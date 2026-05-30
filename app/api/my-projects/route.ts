import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql, hasDb } from '@/lib/db';

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function GET(): Promise<NextResponse> {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasDb()) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  try {
    const rows = await sql!`
      SELECT
        p.code,
        p.title,
        p.city,
        p.rooms::float           AS rooms,
        p.price::float           AS price,
        p.price_on_request,
        p.is_published,
        p.status,
        p.created_at,
        p.expires_at,
        COALESCE(
          (p.data->'images'->((COALESCE(p.data->>'heroImageIndex','0'))::int))->>'enhancedBlobUrl',
          (p.data->'images'->((COALESCE(p.data->>'heroImageIndex','0'))::int))->>'blobUrl',
          (p.data->'images'->0)->>'enhancedBlobUrl',
          (p.data->'images'->0)->>'blobUrl'
        )                        AS hero_url,
        COUNT(pv.id)::int        AS view_count,
        SUM(CASE WHEN pv.contact_clicked  THEN 1 ELSE 0 END)::int AS contact_clicks,
        SUM(CASE WHEN pv.whatsapp_clicked THEN 1 ELSE 0 END)::int AS whatsapp_clicks
      FROM projects p
      LEFT JOIN project_views pv ON pv.project_code = p.code
      WHERE p.user_id = ${userId}
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    return NextResponse.json({ projects: rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[my-projects] GET DB error:', { message });
    return NextResponse.json({ error: 'Failed to load projects' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasDb()) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  const { code, isPublished } = (await req.json()) as { code: string; isPublished: boolean };
  if (!code || typeof isPublished !== 'boolean') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  // Only the project owner can toggle
  await sql!`
    UPDATE projects SET is_published = ${isPublished}, updated_at = now()
    WHERE code = ${code} AND user_id = ${userId}
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasDb()) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  const { code } = (await req.json()) as { code: string };
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

  // Verify ownership before deleting
  const rows = await sql!`SELECT id FROM projects WHERE code = ${code} AND user_id = ${userId}`;
  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await sql!`DELETE FROM project_views WHERE project_code = ${code}`;
  await sql!`DELETE FROM analytics_events WHERE project_code = ${code}`;
  await sql!`DELETE FROM projects WHERE code = ${code}`;
  return NextResponse.json({ ok: true });
}
