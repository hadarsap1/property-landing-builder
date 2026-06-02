import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createVisit, getVisitsByListing } from '@/lib/db/queries/visits'
import { getListingById } from '@/lib/db/queries/listings'
import { ensureSchema } from '@/lib/db/ensure-schema'

export async function GET(req: NextRequest) {
  const session = await auth()
  const agencyId = session?.user?.agencyId
  if (!agencyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const listingId = req.nextUrl.searchParams.get('listingId')
  if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })

  const listing = await getListingById(listingId)
  if (!listing || listing.agency_id !== agencyId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const visits = await getVisitsByListing(listingId)
  return NextResponse.json({ visits })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const agencyId = session?.user?.agencyId
  if (!agencyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureSchema()

  const body = await req.json() as {
    listing_id: string
    visit_at: string
    duration_minutes?: number
    visitor_name?: string
    visitor_phone?: string
    visitor_email?: string
    notes?: string
  }

  if (!body.listing_id || !body.visit_at) {
    return NextResponse.json({ error: 'listing_id and visit_at are required' }, { status: 400 })
  }

  const listing = await getListingById(body.listing_id)
  if (!listing || listing.agency_id !== agencyId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const visit = await createVisit({
    listing_id: body.listing_id,
    agency_id: agencyId,
    visit_at: new Date(body.visit_at),
    duration_minutes: body.duration_minutes ?? 30,
    visitor_name: body.visitor_name ?? null,
    visitor_phone: body.visitor_phone ?? null,
    visitor_email: body.visitor_email ?? null,
    notes: body.notes ?? null,
  })

  return NextResponse.json({ visit }, { status: 201 })
}
