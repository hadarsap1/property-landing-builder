import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getListingById,
  updateListing,
  deleteListing,
  CLIENT_WRITABLE_COLUMNS,
} from '@/lib/db/queries/listings'
import { normaliseSpecIcons } from '@/lib/listings/adapt'
import { ensureSchema } from '@/lib/db/ensure-schema'
import type { Listing } from '@/lib/db/types'
import type { Session } from 'next-auth'
import { withMediaCleanup } from '@/lib/listings/media-cleanup'

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
  // into the buildUpdate SQL string interpolation. Derived from LISTING_COLUMNS (single
  // source of truth) minus server-managed columns like slug/agency_id, so this filter can
  // never drift out of sync with updateListing's assertListingColumns and 500 on save.
  const raw = (await req.json()) as Record<string, unknown>
  const data = Object.fromEntries(
    Object.entries(raw).filter(([k]) => CLIENT_WRITABLE_COLUMNS.has(k))
  ) as Record<string, string | number | boolean | string[] | null>

  // Validate status against known enum
  const VALID_STATUSES = new Set(['active', 'paused', 'sold'])
  if (data.status !== undefined && !VALID_STATUSES.has(data.status as string)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
  }

  // Cap free-text fields to prevent unbounded token spend in AI features.
  // Truncate rather than reject — existing listings may have pre-cap content,
  // and the builder autosaves the whole project on every keystroke, so a hard
  // 400 here would lock the user out of editing entirely.
  const TEXT_CAPS: Record<string, number> = {
    chat_qa: 5000,
    ai_story: 10000,
    raw_description: 10000,
    ai_title: 500,
    ai_tagline: 600,
  }
  for (const [field, cap] of Object.entries(TEXT_CAPS)) {
    const val = data[field]
    if (typeof val === 'string' && val.length > cap) {
      data[field] = val.slice(0, cap)
    }
  }

  // Validate URL fields use https:. Skip the field instead of rejecting —
  // this is autosave; we don't want a single malformed URL to block all saves.
  function isHttpsUrl(val: unknown): boolean {
    if (typeof val !== 'string' || !val) return true // null/empty are fine
    try { return new URL(val).protocol === 'https:' } catch { return false }
  }
  for (const field of ['hero_image_url', 'video_url', 'floor_plan_url'] as const) {
    if (!isHttpsUrl(data[field])) delete data[field]
  }
  // Icon overrides are free-form client input bound for a jsonb column —
  // drop unknown keys and oversized values before they reach the DB.
  if (data.spec_icons !== undefined) {
    data.spec_icons = normaliseSpecIcons(data.spec_icons)
  }
  if (Array.isArray(data.image_urls)) {
    // Always reassign — also strips empty strings that isHttpsUrl treats as "fine"
    data.image_urls = (data.image_urls as string[]).filter(url => !!url && isHttpsUrl(url))
  }

  // Self-migrating: the builder autosaves spec_icons and floor_plan_url on
  // every keystroke, and this route is the first thing a signed-in user hits
  // after a deploy if they go straight to the builder. auth() only runs
  // ensureSchema on initial sign-in, so without this the columns may not exist
  // yet and every save would 500. Cheap after the first call per instance;
  // swallowed because a transient DDL failure must not block saves when the
  // columns are already there — a genuinely missing column still surfaces as a
  // Postgres error from the UPDATE below.
  if (data.spec_icons !== undefined || data.floor_plan_url !== undefined) {
    await ensureSchema().catch(() => {})
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

  // Purge the listing photos alongside the row.
  await withMediaCleanup([id], () => deleteListing(id))
  return new NextResponse(null, { status: 204 })
}
