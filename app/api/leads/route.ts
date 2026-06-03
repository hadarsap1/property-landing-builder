import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createLead, getLeadsByAgency } from '@/lib/db/queries/leads'
import { getListingById } from '@/lib/db/queries/listings'
import { getAgencyById } from '@/lib/db/queries/agencies'
import { sendLeadNotificationEmail } from '@/lib/email'
import type { Lead } from '@/lib/db/types'

const RATE_LIMIT_MAX = 5       // requests
const RATE_LIMIT_WINDOW = 300  // seconds (5 min)

async function isRateLimited(ip: string): Promise<boolean> {
  if (!process.env.KV_URL) return false
  try {
    const { kv } = await import('@vercel/kv')
    const key = `lead_rl:${ip}`
    const count = await kv.incr(key)
    if (count === 1) await kv.expire(key, RATE_LIMIT_WINDOW)
    return count > RATE_LIMIT_MAX
  } catch {
    return false // never block on KV errors
  }
}

function isAllowedOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return true // same-origin requests (SSR, direct) omit Origin header
  const expected = (process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '')
  return !expected || origin === expected
}

// Public: called from listing page contact form
export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await req.json()) as {
    listing_id?: string
    agency_id?: string
    name?: string
    phone?: string
    email?: string
    source?: string
    _hp?: string  // honeypot — must be empty
  }

  // Honeypot: bots fill hidden fields, humans don't
  if (body._hp) {
    return NextResponse.json({ ok: true }) // silent accept to not reveal detection
  }

  // IP rate limiting via KV
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  if (await isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
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

  // Fire-and-forget email notification to agency contact
  void getAgencyById(body.agency_id).then((agency) => {
    const contactEmail = agency?.contact_email
    if (!contactEmail) return
    const listingTitle = listing.ai_title || listing.title || 'נכס'
    const origin = process.env.NEXTAUTH_URL ?? 'https://app.propbuilder.co.il'
    void sendLeadNotificationEmail({
      to: contactEmail,
      leadName: body.name ?? null,
      leadPhone: body.phone ?? null,
      leadEmail: body.email ?? null,
      listingTitle,
      listingUrl: `${origin}/dashboard/leads`,
    })
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
