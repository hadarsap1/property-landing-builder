import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sql } from '@/lib/db'
import { collectListingMediaUrls, deleteBlobs } from '@/lib/listings/media-cleanup'

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

  // Gather the uploaded photos before the rows go — the URLs are only
  // recoverable while the listings still exist. Deleting the account has to
  // take them with it; the privacy policy promises the data is deleted, and a
  // blob URL stays publicly reachable forever otherwise.
  const { rows } = await sql<{ id: string }>`
    SELECT id FROM listings WHERE user_id = ${personalUserId}
  `
  const mediaUrls = await collectListingMediaUrls(rows.map((r) => r.id)).catch(() => [])

  // CASCADE deletes listings and any other owned rows
  await sql`DELETE FROM personal_users WHERE id = ${personalUserId}`
  await deleteBlobs(mediaUrls)
  return new NextResponse(null, { status: 204 })
}
