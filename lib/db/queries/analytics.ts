import { sql } from '@/lib/db'
import type { AnalyticsEvent } from '@/lib/db/types'

type TrackInput = Pick<AnalyticsEvent, 'event_type'> &
  Partial<Pick<AnalyticsEvent, 'listing_id' | 'agency_id' | 'referrer' | 'utm_source' | 'session_id'>>

export async function trackEvent(input: TrackInput): Promise<void> {
  const { event_type, listing_id = null, agency_id = null, referrer = null, utm_source = null, session_id = null } = input
  await sql`
    INSERT INTO analytics_events (event_type, listing_id, agency_id, referrer, utm_source, session_id)
    VALUES (${event_type}, ${listing_id}, ${agency_id}, ${referrer}, ${utm_source}, ${session_id})
  `
}
