import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createVisit, getVisitsByListing } from '@/lib/db/queries/visits'
import { getListingById } from '@/lib/db/queries/listings'
import { createLead } from '@/lib/db/queries/leads'
import { ensureSchema } from '@/lib/db/ensure-schema'
import { db } from '@/lib/db'

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
    visit_type?: 'buyer' | 'seller'
    lead_id?: string | null
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

  const visitType = body.visit_type ?? 'buyer'
  const shouldAutoLead =
    !body.lead_id &&
    visitType === 'buyer' &&
    (body.visitor_name || body.visitor_phone)

  // Use a transaction so we don't end up with an orphan lead if createVisit fails.
  const client = await db.connect()
  try {
    await client.query('BEGIN')

    let leadId = body.lead_id ?? null
    if (shouldAutoLead) {
      const lead = await createLead({
        listing_id: body.listing_id,
        agency_id: agencyId,
        name: body.visitor_name ?? null,
        phone: body.visitor_phone ?? null,
        email: body.visitor_email ?? null,
        source: 'booking',
      })
      leadId = lead.id
    }

    const visit = await createVisit({
      listing_id: body.listing_id,
      agency_id: agencyId,
      visit_at: new Date(body.visit_at),
      duration_minutes: body.duration_minutes ?? 30,
      visit_type: visitType,
      lead_id: leadId,
      visitor_name: body.visitor_name ?? null,
      visitor_phone: body.visitor_phone ?? null,
      visitor_email: body.visitor_email ?? null,
      notes: body.notes ?? null,
    })

    await client.query('COMMIT')
    return NextResponse.json({ visit }, { status: 201 })
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
