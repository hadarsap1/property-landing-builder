import { NextRequest, NextResponse } from 'next/server'
import type { AnalyticsEvent } from '@/lib/db/types'

interface TrackBody {
  event: string
  sessionId: string
  listingId?: string
  agencyId?: string
  referrer?: string
  utmSource?: string
  step?: number
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function isUUID(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v)
}

async function isTrackRateLimited(ip: string): Promise<boolean> {
  if (!process.env.KV_URL) return false
  try {
    const { kv } = await import('@vercel/kv')
    const key = `track_rl:${ip}:${new Date().toISOString().slice(0, 13)}` // per-hour window
    const count = await kv.incr(key)
    if (count === 1) await kv.expire(key, 3600)
    return count > 300 // 300 events/IP/hour
  } catch {
    return false
  }
}

// Events that map to analytics_events in Postgres
const DB_EVENTS = new Set<string>([
  'page_view',
  'whatsapp_click',
  'phone_click',
  'booking_click',
  'open_house_register',
  'wiki_question',
])

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (await isTrackRateLimited(ip)) {
    return NextResponse.json({ ok: true }) // silently accept to not reveal detection
  }

  let body: TrackBody
  try {
    body = (await req.json()) as TrackBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { event, sessionId, listingId, agencyId, referrer, utmSource } = body

  if (!event || typeof event !== 'string') {
    return NextResponse.json({ error: 'Missing event name' }, { status: 400 })
  }
  if (!sessionId || typeof sessionId !== 'string') {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
  }

  // Drop events with invalid UUIDs to prevent data pollution — silently accept
  // so bots don't learn which IDs are valid
  if (listingId && !isUUID(listingId)) return NextResponse.json({ ok: true })
  if (agencyId && !isUUID(agencyId)) return NextResponse.json({ ok: true })

  // Listing-level events go to Postgres analytics_events
  if (DB_EVENTS.has(event) && process.env.POSTGRES_URL) {
    try {
      const { trackEvent } = await import('@/lib/db/queries/analytics')
      await trackEvent({
        event_type: event as AnalyticsEvent['event_type'],
        listing_id: listingId ?? null,
        agency_id: agencyId ?? null,
        referrer: (referrer ?? req.headers.get('referer') ?? null)?.slice(0, 500) ?? null,
        utm_source: (utmSource ?? null)?.slice(0, 200) ?? null,
        session_id: sessionId.slice(0, 64),
      })
    } catch (err) {
      console.error('[track] Postgres error:', err)
    }
    return NextResponse.json({ ok: true })
  }

  // Builder wizard events go to KV (existing behaviour)
  const entry = {
    event,
    sessionId: sessionId.slice(0, 64),
    step: body.step,
    timestamp: new Date().toISOString(),
  }

  if (!process.env.KV_URL) {
    console.info('[track] Dev event:', entry)
    return NextResponse.json({ ok: true })
  }

  try {
    const { kv } = await import('@vercel/kv')
    await kv.lpush('analytics:events', JSON.stringify(entry))
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[track] KV error:', { message })
    // Non-critical — never fail the caller
  }

  return NextResponse.json({ ok: true })
}
