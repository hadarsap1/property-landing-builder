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

  // Anonymous listing creation requires KV for rate-limiting. Without KV,
  // refuse to prevent DB spam (fail-closed).
  if (!process.env.KV_URL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { kv } = await import('@vercel/kv')
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const today = new Date().toISOString().slice(0, 10)
    const key = `rl:anon_listings:${ip}:${today}`
    const count = await kv.incr(key)
    if (count === 1) await kv.expire(key, 86_400)
    if (count > 5) {
      return NextResponse.json({ error: 'יותר מדי נכסים — נסה מחר' }, { status: 429 })
    }
  } catch {
    // KV error — fail closed for anonymous users
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

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
