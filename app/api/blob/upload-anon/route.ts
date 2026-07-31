import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getListingById } from '@/lib/db/queries/listings'
import { kvRateLimit } from '@/lib/rate-limit'

/**
 * Photo upload for the anonymous builder.
 *
 * The wizard lets people build a whole listing before registering, but
 * /api/blob/upload requires a session, so their photos used to fail and be
 * silently dropped. This endpoint fills that gap without opening a general
 * unauthenticated write:
 *
 * - The upload must name an existing listing that has no owner. That is the
 *   same thing PATCH /api/listings/[id] already allows anonymously, so it
 *   grants no access that wasn't already reachable with the same UUID. Once a
 *   registered user claims the listing it stops qualifying, and the owner's
 *   session uses the authenticated route instead.
 * - Rate limited per listing and per IP, and fail-closed: no KV means no
 *   anonymous uploads at all, matching anonymous listing creation. An
 *   unauthenticated blob write with no counter is a spam target.
 */

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

// A listing holds at most 10 photos plus a floor plan; the headroom covers
// retries and replacements without allowing bulk storage.
const PER_LISTING_DAILY = 15
// Cheap to mint new listings, so the per-IP ceiling is what actually bounds abuse.
const PER_IP_DAILY = 30

export async function POST(req: NextRequest): Promise<NextResponse> {
  const listingId = req.nextUrl.searchParams.get('listingId')
  if (!listingId) {
    return NextResponse.json({ error: 'Missing listingId' }, { status: 400 })
  }

  const listing = await getListingById(listingId).catch(() => null)
  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }
  // Owned listings must go through the authenticated route, which bills the
  // upload against that account's quota.
  if (listing.agency_id || listing.user_id) {
    return NextResponse.json({ error: 'Listing is not anonymous' }, { status: 403 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Blob storage not configured' }, { status: 503 })
  }

  const today = new Date().toISOString().slice(0, 10)
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  // kvRateLimit fails closed, so a missing or broken KV blocks the upload
  // rather than leaving it uncounted.
  if (await kvRateLimit(`rl:anon_upload_listing:${listingId}:${today}`, PER_LISTING_DAILY, 86_400)) {
    return NextResponse.json({ error: 'הגעת למגבלת התמונות לנכס זה' }, { status: 429 })
  }
  if (await kvRateLimit(`rl:anon_upload_ip:${ip}:${today}`, PER_IP_DAILY, 86_400)) {
    return NextResponse.json({ error: 'הגעת למגבלה היומית להעלאת תמונות' }, { status: 429 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP and GIF are allowed' }, { status: 415 })
  }

  const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 413 })
  }

  const ext = MIME_EXT[file.type] ?? 'jpg'
  // Prefixed so anonymous uploads stay identifiable for cleanup.
  const pathname = `anon-listings/${listingId}/${Date.now()}.${ext}`

  const blob = await put(pathname, file, { access: 'public', contentType: file.type })

  return NextResponse.json({ url: blob.url }, { status: 201 })
}
