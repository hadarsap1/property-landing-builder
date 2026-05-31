import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getListingsByAgency,
  createListing,
  generateUniqueSlug,
} from '@/lib/db/queries/listings'

export async function GET(): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const listings = await getListingsByAgency(session.user.agencyId)
  return NextResponse.json({ listings })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { title?: string; street?: string; city?: string } = {}
  try {
    body = (await req.json()) as typeof body
  } catch {
    // empty body is fine
  }

  const baseSlug = [body.street, body.city].filter(Boolean).join(' ') || 'listing'
  const slug = await generateUniqueSlug(session.user.agencyId, baseSlug)

  const listing = await createListing({
    agency_id: session.user.agencyId,
    agent_id: session.user.id ?? null,
    slug,
    title: body.title ?? null,
    street: body.street ?? null,
    city: body.city ?? null,
  })

  return NextResponse.json({ listing }, { status: 201 })
}
