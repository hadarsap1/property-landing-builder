import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createLead, getLeadsByAgency } from '@/lib/db/queries/leads'
import { getListingById } from '@/lib/db/queries/listings'
import type { Lead } from '@/lib/db/types'

// Public: called from listing page contact form
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as {
    listing_id?: string
    agency_id?: string
    name?: string
    phone?: string
    email?: string
    source?: string
  }

  if (!body.listing_id || !body.agency_id) {
    return NextResponse.json({ error: 'listing_id and agency_id required' }, { status: 400 })
  }

  // Verify the listing belongs to the stated agency (prevents spoofing)
  const listing = await getListingById(body.listing_id)
  if (!listing || listing.agency_id !== body.agency_id) {
    return NextResponse.json({ error: 'Invalid listing' }, { status: 400 })
  }

  const validSources: Lead['source'][] = ['booking', 'open_house', 'whatsapp', 'direct']
  const source = validSources.includes(body.source as Lead['source'])
    ? (body.source as Lead['source'])
    : 'direct'

  const lead = await createLead({
    listing_id: body.listing_id,
    agency_id: body.agency_id,
    name: body.name ?? null,
    phone: body.phone ?? null,
    email: body.email ?? null,
    source,
  })

  return NextResponse.json({ lead }, { status: 201 })
}

// Authenticated: agent fetches leads
export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const listingId = searchParams.get('listingId') ?? undefined
  const status = (searchParams.get('status') ?? undefined) as Lead['status'] | undefined

  const leads = await getLeadsByAgency(session.user.agencyId, { listingId, status })
  return NextResponse.json({ leads })
}
