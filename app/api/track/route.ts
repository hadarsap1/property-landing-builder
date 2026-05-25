import { NextRequest, NextResponse } from 'next/server';

interface TrackBody {
  event: string;
  sessionId: string;
  step?: number;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: TrackBody;
  try {
    body = (await req.json()) as TrackBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { event, sessionId, step } = body;

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
    timestamp: new Date().toISOString(),
  };

  const isDev = !process.env.KV_URL;
  if (isDev) {
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
    // Tracking failures are non-critical — return ok to avoid breaking the wizard
    return NextResponse.json({ ok: true });
  }
}
