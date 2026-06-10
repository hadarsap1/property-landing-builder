import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

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

  const code = crypto.randomUUID();

  const isDev = !process.env.KV_URL;
  if (isDev) {
    console.info('[save-project] Dev mode: returning mock code', code);
    return NextResponse.json({ code });
  }

  try {
    const { kv } = await import('@vercel/kv');
    const key = `project:${code}`;
    const ttl = 60 * 60 * 24 * 90; // 90 days
    await kv.set(key, JSON.stringify(project), { ex: ttl });
    return NextResponse.json({ code });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[save-project] KV error:', { message });
    return NextResponse.json({ error: 'Failed to save project' }, { status: 500 });
  }
}
