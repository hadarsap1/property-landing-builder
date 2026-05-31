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

  // Allowlist: only known listing columns may be written — prevents column-name injection
  // into the buildUpdate SQL string interpolation
  const WRITABLE_FIELDS = new Set([
    'title', 'street', 'city', 'neighborhood', 'price', 'price_on_request',
    'built_area', 'outdoor_area', 'rooms', 'floor', 'total_floors',
    'parking_spots', 'parking_covered', 'has_storage', 'has_saferoom',
    'has_elevator', 'air_directions', 'build_year', 'renovation_year', 'bathrooms',
    'raw_description', 'ai_title', 'ai_tagline', 'ai_story', 'ai_highlights',
    'hero_image_url', 'image_urls', 'video_url', 'gallery_type', 'carousel_speed',
    'show_map', 'map_query_override', 'template_id', 'accent_color', 'font_style',
    'section_order', 'hidden_sections', 'seller_name', 'seller_phone', 'seller_whatsapp',
    'open_house_date', 'open_house_end', 'status', 'slug',
  ])
  const raw = (await req.json()) as Record<string, unknown>
  const data = Object.fromEntries(
    Object.entries(raw).filter(([k]) => WRITABLE_FIELDS.has(k))
  ) as Record<string, string | number | boolean | string[] | null>

  const updated = await updateListing(id, data)
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
