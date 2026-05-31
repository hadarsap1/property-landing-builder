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

export interface AgencyStats {
  total_views: number
  unique_sessions: number
  whatsapp_clicks: number
  phone_clicks: number
  booking_clicks: number
}

export async function getAgencyStats(agencyId: string, days = 30): Promise<AgencyStats> {
  const { rows } = await sql<{
    total_views: string
    unique_sessions: string
    whatsapp_clicks: string
    phone_clicks: string
    booking_clicks: string
  }>`
    SELECT
      COUNT(*) FILTER (WHERE event_type = 'page_view')        AS total_views,
      COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'page_view') AS unique_sessions,
      COUNT(*) FILTER (WHERE event_type = 'whatsapp_click')   AS whatsapp_clicks,
      COUNT(*) FILTER (WHERE event_type = 'phone_click')      AS phone_clicks,
      COUNT(*) FILTER (WHERE event_type = 'booking_click')    AS booking_clicks
    FROM analytics_events
    WHERE agency_id = ${agencyId}
      AND created_at >= now() - (${days} || ' days')::interval
  `
  const r = rows[0]
  return {
    total_views:     parseInt(r?.total_views     ?? '0', 10),
    unique_sessions: parseInt(r?.unique_sessions ?? '0', 10),
    whatsapp_clicks: parseInt(r?.whatsapp_clicks ?? '0', 10),
    phone_clicks:    parseInt(r?.phone_clicks    ?? '0', 10),
    booking_clicks:  parseInt(r?.booking_clicks  ?? '0', 10),
  }
}

export interface DayBucket {
  date: string   // YYYY-MM-DD
  views: number
  clicks: number
}

export async function getAgencyTimeSeries(agencyId: string, days = 30): Promise<DayBucket[]> {
  const { rows } = await sql<{ date: string; views: string; clicks: string }>`
    WITH series AS (
      SELECT generate_series(
        (now() - (${days - 1} || ' days')::interval)::date,
        now()::date,
        '1 day'::interval
      )::date AS day
    )
    SELECT
      s.day::text AS date,
      COALESCE(SUM(CASE WHEN e.event_type = 'page_view' THEN 1 ELSE 0 END), 0)::text AS views,
      COALESCE(SUM(CASE WHEN e.event_type IN ('whatsapp_click','phone_click','booking_click') THEN 1 ELSE 0 END), 0)::text AS clicks
    FROM series s
    LEFT JOIN analytics_events e
      ON e.created_at::date = s.day
      AND e.agency_id = ${agencyId}
    GROUP BY s.day
    ORDER BY s.day ASC
  `
  return rows.map(r => ({
    date: r.date,
    views: parseInt(r.views, 10),
    clicks: parseInt(r.clicks, 10),
  }))
}

export interface ListingStatRow {
  listing_id: string
  views: number
  unique_sessions: number
  clicks: number
}

export async function getListingStats(agencyId: string, days = 30): Promise<ListingStatRow[]> {
  const { rows } = await sql<{
    listing_id: string
    views: string
    unique_sessions: string
    clicks: string
  }>`
    SELECT
      listing_id,
      COUNT(*) FILTER (WHERE event_type = 'page_view')        AS views,
      COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'page_view') AS unique_sessions,
      COUNT(*) FILTER (WHERE event_type IN ('whatsapp_click','phone_click','booking_click')) AS clicks
    FROM analytics_events
    WHERE agency_id = ${agencyId}
      AND listing_id IS NOT NULL
      AND created_at >= now() - (${days} || ' days')::interval
    GROUP BY listing_id
    ORDER BY views DESC
    LIMIT 20
  `
  return rows.map(r => ({
    listing_id:      r.listing_id,
    views:           parseInt(r.views,           10),
    unique_sessions: parseInt(r.unique_sessions, 10),
    clicks:          parseInt(r.clicks,          10),
  }))
}
