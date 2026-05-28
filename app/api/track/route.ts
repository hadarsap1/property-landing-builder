import { NextRequest, NextResponse } from 'next/server';
import { sql, hasDb } from '@/lib/db';

interface TrackBody {
  event: string;
  sessionId: string;
  step?: number;
  projectCode?: string;
  metadata?: Record<string, unknown>;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: TrackBody;
  try {
    body = (await req.json()) as TrackBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { event, sessionId, step, projectCode, metadata } = body;

  if (!event || typeof event !== 'string') {
    return NextResponse.json({ error: 'Missing event name' }, { status: 400 });
  }
  if (!sessionId || typeof sessionId !== 'string') {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  const entry = {
    event,
    sessionId,
    step,
    projectCode: projectCode ?? null,
    timestamp: new Date().toISOString(),
    metadata,
  };

  // ── Write to PostgreSQL ────────────────────────────────────────────────────
  if (hasDb()) {
    try {
      await sql!`
        INSERT INTO analytics_events (session_id, project_code, event, step, metadata)
        VALUES (
          ${sessionId},
          ${projectCode ?? null},
          ${event},
          ${step ?? null},
          ${metadata ? JSON.stringify(metadata) : null}
        )
      `;
      return NextResponse.json({ ok: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[track] DB error:', { message });
      // Fall through to KV
    }
  }

  // ── KV fallback ───────────────────────────────────────────────────────────
  if (!process.env.KV_URL) {
    console.info('[track] Dev event:', entry);
    return NextResponse.json({ ok: true });
  }

  try {
    const { kv } = await import('@vercel/kv');
    await kv.lpush('analytics:events', JSON.stringify(entry));
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[track] KV error:', { message });
    // Tracking failures are non-critical
    return NextResponse.json({ ok: true });
  }
}
