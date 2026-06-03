import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getListingById,
  updateListing,
  deleteListing,
} from '@/lib/db/queries/listings'
import type { Listing } from '@/lib/db/types'
import type { Session } from 'next-auth'

type RouteContext = { params: Promise<{ id: string }> }

function canAccess(listing: Listing, session: Session | null): boolean {
  const user = session?.user as { agencyId?: string; personalUserId?: string } | undefined
  if (user?.agencyId && listing.agency_id === user.agencyId) return true
  if (user?.personalUserId && listing.user_id === user.personalUserId) return true
  // Allow access to listings with no owner (anonymous builder autosave)
  if (!listing.agency_id && !listing.user_id) return true
  return false
}

export async function GET(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id } = await params
  const session = await auth()

  const listing = await getListingById(id)
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!canAccess(listing, session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ listing })
}

export async function PATCH(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id } = await params
  const session = await auth()

  const existing = await getListingById(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!canAccess(existing, session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Allowlist: only known listing columns may be written — prevents column-name injection
  // into the buildUpdate SQL string interpolation
  const WRITABLE_FIELDS = new Set([
    'title', 'street', 'city', 'neighborhood', 'price', 'price_on_request',
    'built_area', 'outdoor_area', 'rooms', 'floor', 'total_floors',
    'parking_spots', 'parking_covered', 'has_storage', 'has_saferoom',
    'has_elevator', 'air_directions', 'build_year', 'renovation_year', 'bathrooms',
    'raw_description', 'ai_title', 'ai_tagline', 'ai_story', 'ai_highlights', 'chat_qa',
    'hero_image_url', 'image_urls', 'video_url', 'gallery_type', 'carousel_speed',
    'show_map', 'map_query_override', 'template_id', 'accent_color', 'font_style',
    'section_order', 'hidden_sections', 'seller_name', 'seller_phone', 'seller_whatsapp',
    'open_house_date', 'open_house_end', 'status',
    // 'slug' intentionally omitted — slugs are server-generated and must not be client-writable
  ])
  const raw = (await req.json()) as Record<string, unknown>
  const data = Object.fromEntries(
    Object.entries(raw).filter(([k]) => WRITABLE_FIELDS.has(k))
  ) as Record<string, string | number | boolean | string[] | null>

  // Validate status against known enum
  const VALID_STATUSES = new Set(['active', 'paused', 'sold'])
  if (data.status !== undefined && !VALID_STATUSES.has(data.status as string)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
  }

  // Cap free-text fields to prevent unbounded token spend in AI features
  const TEXT_CAPS: Record<string, number> = {
    chat_qa: 5000,
    ai_story: 10000,
    raw_description: 10000,
    ai_title: 200,
    ai_tagline: 300,
  }
  for (const [field, cap] of Object.entries(TEXT_CAPS)) {
    if (typeof data[field] === 'string' && (data[field] as string).length > cap) {
      return NextResponse.json({ error: `${field} exceeds ${cap} character limit` }, { status: 400 })
    }
  }

  // Validate that URL fields use https: scheme only (use URL parser for well-formedness)
  function isHttpsUrl(val: unknown): boolean {
    if (typeof val !== 'string' || !val) return true // null/empty are fine
    try { return new URL(val).protocol === 'https:' } catch { return false }
  }
  for (const field of ['hero_image_url', 'video_url'] as const) {
    if (!isHttpsUrl(data[field])) {
      return NextResponse.json({ error: `${field} must be a valid https:// URL` }, { status: 400 })
    }
  }
  if (Array.isArray(data.image_urls)) {
    for (const url of data.image_urls as string[]) {
      if (!isHttpsUrl(url)) {
        return NextResponse.json({ error: 'image_urls must be valid https:// URLs' }, { status: 400 })
      }
    }
  }

  const updated = await updateListing(id, data)
  return NextResponse.json({ listing: updated })
}

export async function DELETE(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id } = await params
  const session = await auth()

  const existing = await getListingById(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!canAccess(existing, session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await deleteListing(id)
  return new NextResponse(null, { status: 204 })
}
