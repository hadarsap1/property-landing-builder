import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getListingById } from '@/lib/db/queries/listings'
import { getPendingChangesByListing } from '@/lib/db/queries/pending-changes'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const listing = await getListingById(id)
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (listing.agency_id !== session.user.agencyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const changes = await getPendingChangesByListing(id)
  return NextResponse.json({ changes })
}
