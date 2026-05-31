import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getListingById,
  updateListing,
  deleteListing,
} from '@/lib/db/queries/listings'

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

  return NextResponse.json({ listing })
}

export async function PATCH(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await getListingById(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.agency_id !== session.user.agencyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const data = (await req.json()) as Record<string, unknown>
  // Strip fields that must not be client-writable
  delete data.id
  delete data.agency_id
  delete data.created_at

  const updated = await updateListing(id, data as Record<string, string | number | boolean | string[] | null>)
  return NextResponse.json({ listing: updated })
}

export async function DELETE(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await getListingById(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.agency_id !== session.user.agencyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await deleteListing(id)
  return new NextResponse(null, { status: 204 })
}
