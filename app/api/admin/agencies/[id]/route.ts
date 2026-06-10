import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sql } from '@/lib/db'
import type { Session } from 'next-auth'

function isAdmin(session: Session | null): boolean {
  return !!process.env.SUPER_ADMIN_EMAIL && session?.user?.email === process.env.SUPER_ADMIN_EMAIL
}

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const { rows } = await sql`SELECT id FROM agencies WHERE id = ${id} LIMIT 1`
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // CASCADE on agencies removes agents, listings, subscriptions, etc.
  await sql`DELETE FROM agencies WHERE id = ${id}`
  return new NextResponse(null, { status: 204 })
}
