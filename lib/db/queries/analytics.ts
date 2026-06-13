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

export interface FunnelStats {
  views: number
  unique_sessions: number
  contact_clicks: number
  leads: number
  open_house_regs: number
}

/** Views → unique visitors → contact clicks → leads, over the same window. */
export async function getAgencyFunnel(agencyId: string, days = 30): Promise<FunnelStats> {
  const [events, leadRows] = await Promise.all([
    sql<{ views: string; unique_sessions: string; contact_clicks: string }>`
      SELECT
        COUNT(*) FILTER (WHERE event_type = 'page_view') AS views,
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'page_view') AS unique_sessions,
        COUNT(*) FILTER (WHERE event_type IN ('whatsapp_click','phone_click','booking_click')) AS contact_clicks
      FROM analytics_events
      WHERE agency_id = ${agencyId}
        AND created_at >= now() - (${days} || ' days')::interval
    `,
    sql<{ leads: string; open_house_regs: string }>`
      SELECT
        COUNT(*) AS leads,
        COUNT(*) FILTER (WHERE source = 'open_house') AS open_house_regs
      FROM leads
      WHERE agency_id = ${agencyId}
        AND created_at >= now() - (${days} || ' days')::interval
    `,
  ])
  const e = events.rows[0]
  const l = leadRows.rows[0]
  return {
    views:           parseInt(e?.views           ?? '0', 10),
    unique_sessions: parseInt(e?.unique_sessions ?? '0', 10),
    contact_clicks:  parseInt(e?.contact_clicks  ?? '0', 10),
    leads:           parseInt(l?.leads           ?? '0', 10),
    open_house_regs: parseInt(l?.open_house_regs ?? '0', 10),
  }
}

/** Lead counts per listing for the same window — joined into the per-listing table. */
export async function getLeadCountsByListing(agencyId: string, days = 30): Promise<Record<string, number>> {
  const { rows } = await sql<{ listing_id: string; leads: string }>`
    SELECT listing_id, COUNT(*) AS leads
    FROM leads
    WHERE agency_id = ${agencyId}
      AND listing_id IS NOT NULL
      AND created_at >= now() - (${days} || ' days')::interval
    GROUP BY listing_id
  `
  return Object.fromEntries(rows.map((r) => [r.listing_id, parseInt(r.leads, 10)]))
}

export interface ListingStatRow {
  listing_id: string
  views: number
  unique_sessions: number
  clicks: number
}

export interface DigestWeekStats {
  views: number
  unique_sessions: number
  contact_clicks: number
  leads: number
  open_house_regs: number
}

export interface DigestTopListing {
  listing_id: string
  title: string
  city: string | null
  slug: string
  views: number
  unique_sessions: number
  leads: number
}

export interface DigestUpcomingOpenHouse {
  title: string
  city: string | null
  slug: string
  open_house_date: Date
}

export interface WeeklyDigestData {
  currentWeek: DigestWeekStats
  previousWeek: DigestWeekStats
  topListings: DigestTopListing[]
  upcomingOpenHouses: DigestUpcomingOpenHouse[]
}

export async function getWeeklyDigestData(agencyId: string): Promise<WeeklyDigestData> {
  const [curEvents, curLeads, prevEvents, prevLeads, topRows, leadsPerListing, openHouseRows] =
    await Promise.all([
      sql<{ views: string; unique_sessions: string; contact_clicks: string }>`
        SELECT
          COUNT(*) FILTER (WHERE event_type = 'page_view') AS views,
          COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'page_view') AS unique_sessions,
          COUNT(*) FILTER (WHERE event_type IN ('whatsapp_click','phone_click','booking_click')) AS contact_clicks
        FROM analytics_events
        WHERE agency_id = ${agencyId} AND created_at >= now() - interval '7 days'
      `,
      sql<{ leads: string; open_house_regs: string }>`
        SELECT COUNT(*) AS leads,
               COUNT(*) FILTER (WHERE source = 'open_house') AS open_house_regs
        FROM leads
        WHERE agency_id = ${agencyId} AND created_at >= now() - interval '7 days'
      `,
      sql<{ views: string; unique_sessions: string; contact_clicks: string }>`
        SELECT
          COUNT(*) FILTER (WHERE event_type = 'page_view') AS views,
          COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'page_view') AS unique_sessions,
          COUNT(*) FILTER (WHERE event_type IN ('whatsapp_click','phone_click','booking_click')) AS contact_clicks
        FROM analytics_events
        WHERE agency_id = ${agencyId}
          AND created_at >= now() - interval '14 days'
          AND created_at <  now() - interval '7 days'
      `,
      sql<{ leads: string; open_house_regs: string }>`
        SELECT COUNT(*) AS leads,
               COUNT(*) FILTER (WHERE source = 'open_house') AS open_house_regs
        FROM leads
        WHERE agency_id = ${agencyId}
          AND created_at >= now() - interval '14 days'
          AND created_at <  now() - interval '7 days'
      `,
      sql<{ listing_id: string; title: string; city: string | null; slug: string; views: string; unique_sessions: string }>`
        SELECT e.listing_id,
               COALESCE(li.ai_title, li.title) AS title,
               li.city, li.slug,
               COUNT(*) FILTER (WHERE e.event_type = 'page_view') AS views,
               COUNT(DISTINCT e.session_id) FILTER (WHERE e.event_type = 'page_view') AS unique_sessions
        FROM analytics_events e
        JOIN listings li ON li.id = e.listing_id
        WHERE e.agency_id = ${agencyId}
          AND e.listing_id IS NOT NULL
          AND e.created_at >= now() - interval '7 days'
        GROUP BY e.listing_id, li.ai_title, li.title, li.city, li.slug
        ORDER BY views DESC
        LIMIT 5
      `,
      sql<{ listing_id: string; leads: string }>`
        SELECT listing_id, COUNT(*) AS leads
        FROM leads
        WHERE agency_id = ${agencyId}
          AND listing_id IS NOT NULL
          AND created_at >= now() - interval '7 days'
        GROUP BY listing_id
      `,
      sql<{ title: string; city: string | null; slug: string; open_house_date: Date }>`
        SELECT COALESCE(ai_title, title) AS title, city, slug, open_house_date
        FROM listings
        WHERE agency_id = ${agencyId}
          AND status = 'active'
          AND open_house_date >= now()
          AND open_house_date <= now() + interval '7 days'
        ORDER BY open_house_date ASC
        LIMIT 5
      `,
    ])

  const leadsMap = Object.fromEntries(
    leadsPerListing.rows.map((r) => [r.listing_id, parseInt(r.leads, 10)])
  )

  return {
    currentWeek: {
      views:           parseInt(curEvents.rows[0]?.views           ?? '0', 10),
      unique_sessions: parseInt(curEvents.rows[0]?.unique_sessions ?? '0', 10),
      contact_clicks:  parseInt(curEvents.rows[0]?.contact_clicks  ?? '0', 10),
      leads:           parseInt(curLeads.rows[0]?.leads            ?? '0', 10),
      open_house_regs: parseInt(curLeads.rows[0]?.open_house_regs  ?? '0', 10),
    },
    previousWeek: {
      views:           parseInt(prevEvents.rows[0]?.views           ?? '0', 10),
      unique_sessions: parseInt(prevEvents.rows[0]?.unique_sessions ?? '0', 10),
      contact_clicks:  parseInt(prevEvents.rows[0]?.contact_clicks  ?? '0', 10),
      leads:           parseInt(prevLeads.rows[0]?.leads            ?? '0', 10),
      open_house_regs: parseInt(prevLeads.rows[0]?.open_house_regs  ?? '0', 10),
    },
    topListings: topRows.rows.map((r) => ({
      listing_id:      r.listing_id,
      title:           r.title,
      city:            r.city,
      slug:            r.slug,
      views:           parseInt(r.views,           10),
      unique_sessions: parseInt(r.unique_sessions, 10),
      leads:           leadsMap[r.listing_id] ?? 0,
    })),
    upcomingOpenHouses: openHouseRows.rows,
  }
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
