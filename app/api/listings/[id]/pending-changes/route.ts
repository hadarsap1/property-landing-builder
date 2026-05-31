import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getListingById } from '@/lib/db/queries/listings'
import { getPendingChangesByListing } from '@/lib/db/queries/pending-changes'
import type { Session } from 'next-auth'
import type { Listing } from '@/lib/db/types'

type RouteContext = { params: Promise<{ id: string }> }

function ownsListing(listing: Listing, session: Session | null): boolean {
  const user = session?.user as { agencyId?: string; personalUserId?: string } | undefined
  if (user?.agencyId && listing.agency_id === user.agencyId) return true
  if (user?.personalUserId && listing.user_id === user.personalUserId) return true
  return false
}

export async function GET(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id } = await params
  const session = await auth()

  const listing = await getListingById(id)
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!ownsListing(listing, session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const changes = await getPendingChangesByListing(id)
  return NextResponse.json({ changes })
}
