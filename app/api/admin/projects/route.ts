import { NextRequest, NextResponse } from 'next/server';
import { auth, isAdmin } from '@/auth';
import { sql, hasDb } from '@/lib/db';

async function guardAdmin(): Promise<string | null> {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) return null;
  return session!.user!.email!;
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  if (!await guardAdmin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!hasDb()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { code, isPublished } = (await req.json()) as { code: string; isPublished: boolean };
  if (!code || typeof isPublished !== 'boolean') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  await sql!`
    UPDATE projects SET is_published = ${isPublished}, updated_at = now()
    WHERE code = ${code}
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  if (!await guardAdmin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!hasDb()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { code } = (await req.json()) as { code: string };
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  await sql!`DELETE FROM project_views WHERE project_code = ${code}`;
  await sql!`DELETE FROM analytics_events WHERE project_code = ${code}`;
  await sql!`DELETE FROM projects WHERE code = ${code}`;
  return NextResponse.json({ ok: true });
}
