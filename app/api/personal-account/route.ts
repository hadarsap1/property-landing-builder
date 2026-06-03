import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sql } from '@/lib/db'

export async function DELETE(): Promise<NextResponse> {
  const session = await auth()
  const personalUserId = session?.user?.personalUserId
  if (!personalUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // personalUserId persists in JWT after a personal→commercial upgrade; block it
  // so upgraded users can't accidentally cascade-delete their old personal listings.
  if (session.user?.agencyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // CASCADE deletes listings and any other owned rows
  await sql`DELETE FROM personal_users WHERE id = ${personalUserId}`
  return new NextResponse(null, { status: 204 })
}
