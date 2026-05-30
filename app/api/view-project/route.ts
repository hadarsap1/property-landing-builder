import { NextRequest, NextResponse } from 'next/server';
import { sql, hasDb } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

interface ViewBody {
  projectCode: string;
  viewerSessionId: string;
  referrer?: string;
  contactClicked?: boolean;
  whatsappClicked?: boolean;
  durationSeconds?: number;
}

// POST — create or update a view record
export async function POST(req: NextRequest): Promise<NextResponse> {
  const limited = await rateLimit(req, { name: 'view-project', limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  let body: ViewBody;
  try {
    body = (await req.json()) as ViewBody;
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const {
    projectCode,
    viewerSessionId,
    referrer,
    contactClicked,
    whatsappClicked,
    durationSeconds,
  } = body;

  if (!projectCode || !/^\d{6}$/.test(projectCode)) {
    return NextResponse.json({ error: 'Invalid projectCode' }, { status: 400 });
  }
  if (!viewerSessionId) {
    return NextResponse.json({ error: 'Missing viewerSessionId' }, { status: 400 });
  }

  if (!hasDb()) {
    return NextResponse.json({ ok: true }); // silently skip in dev
  }

  try {
    // Upsert: one row per (project_code, viewer_session_id)
    await sql!`
      INSERT INTO project_views (project_code, viewer_session_id, referrer, contact_clicked, whatsapp_clicked, duration_seconds)
      VALUES (${projectCode}, ${viewerSessionId}, ${referrer ?? null}, ${contactClicked ?? false}, ${whatsappClicked ?? false}, ${durationSeconds ?? null})
      ON CONFLICT (project_code, viewer_session_id) DO UPDATE SET
        contact_clicked  = project_views.contact_clicked  OR EXCLUDED.contact_clicked,
        whatsapp_clicked = project_views.whatsapp_clicked OR EXCLUDED.whatsapp_clicked,
        duration_seconds = COALESCE(EXCLUDED.duration_seconds, project_views.duration_seconds)
    `;
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[view-project] DB error:', { message });
    return NextResponse.json({ ok: true }); // non-critical
  }
}
