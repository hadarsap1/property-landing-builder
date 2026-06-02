import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sql } from '@/lib/db'
import { getPersonalUserById } from '@/lib/db/queries/personal-users'
import type { Session } from 'next-auth'

function isAdmin(session: Session | null): boolean {
  return !!process.env.SUPER_ADMIN_EMAIL && session?.user?.email === process.env.SUPER_ADMIN_EMAIL
}

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const session = await auth()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const existing = await getPersonalUserById(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // ON DELETE CASCADE on listings.user_id will remove their listings too
  await sql`DELETE FROM personal_users WHERE id = ${id}`
  return new NextResponse(null, { status: 204 })
}
