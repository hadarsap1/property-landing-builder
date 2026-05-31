import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getListingsByAgency,
  getListingsByUser,
  createListing,
  generateUniqueSlug,
  generateUniqueSlugForUser,
} from '@/lib/db/queries/listings'

export async function GET(): Promise<NextResponse> {
  const session = await auth()

  if (session?.user?.agencyId) {
    const listings = await getListingsByAgency(session.user.agencyId)
    return NextResponse.json({ listings })
  }

  if (session?.user?.personalUserId) {
    const listings = await getListingsByUser(session.user.personalUserId)
    return NextResponse.json({ listings })
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth()

  let body: { title?: string; street?: string; city?: string } = {}
  try {
    body = (await req.json()) as typeof body
  } catch {
    // empty body is fine
  }

  const baseSlug = [body.street, body.city].filter(Boolean).join(' ') || 'listing'

  if (session?.user?.agencyId) {
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

  if (session?.user?.personalUserId) {
    const slug = await generateUniqueSlugForUser(session.user.personalUserId, baseSlug)
    const listing = await createListing({
      agency_id: null,
      user_id: session.user.personalUserId,
      slug,
      title: body.title ?? null,
      street: body.street ?? null,
      city: body.city ?? null,
    })
    return NextResponse.json({ listing }, { status: 201 })
  }

  // Anonymous users: create listing with no owner (they use localStorage only)
  // We still create a DB record so the URL works, but without ownership
  const slug = `listing-${Date.now()}`
  const listing = await createListing({
    agency_id: null,
    user_id: null,
    slug,
    title: body.title ?? null,
    street: body.street ?? null,
    city: body.city ?? null,
  })
  return NextResponse.json({ listing }, { status: 201 })
}
