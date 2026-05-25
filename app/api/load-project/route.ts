import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const code = req.nextUrl.searchParams.get('code');
  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'Missing or invalid code' }, { status: 400 });
  }

  const isDev = !process.env.KV_URL;
  if (isDev) {
    console.info('[load-project] Dev mode: KV not available');
    return NextResponse.json({ error: 'KV not configured in development' }, { status: 404 });
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
