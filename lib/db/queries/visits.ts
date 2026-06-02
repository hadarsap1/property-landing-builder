import { sql } from '@/lib/db'
import type { PropertyVisit } from '@/lib/db/types'

export async function getVisitsByListing(listingId: string): Promise<PropertyVisit[]> {
  const { rows } = await sql<PropertyVisit>`
    SELECT * FROM property_visits
    WHERE listing_id = ${listingId}
    ORDER BY visit_at ASC
  `
  return rows
}

export async function getVisitsByAgency(agencyId: string): Promise<(PropertyVisit & { listing_title: string | null; listing_address: string | null })[]> {
  const { rows } = await sql<PropertyVisit & { listing_title: string | null; listing_address: string | null }>`
    SELECT v.*,
           COALESCE(l.ai_title, l.title) AS listing_title,
           CONCAT_WS(', ', l.street, l.city) AS listing_address
    FROM property_visits v
    JOIN listings l ON l.id = v.listing_id
    WHERE v.agency_id = ${agencyId}
    ORDER BY v.visit_at ASC
  `
  return rows
}

export async function getUpcomingVisitsByAgency(agencyId: string): Promise<(PropertyVisit & { listing_title: string | null; listing_address: string | null })[]> {
  const { rows } = await sql<PropertyVisit & { listing_title: string | null; listing_address: string | null }>`
    SELECT v.*,
           COALESCE(l.ai_title, l.title) AS listing_title,
           CONCAT_WS(', ', l.street, l.city) AS listing_address
    FROM property_visits v
    JOIN listings l ON l.id = v.listing_id
    WHERE v.agency_id = ${agencyId}
      AND v.visit_at >= NOW() - INTERVAL '1 hour'
      AND v.status = 'scheduled'
    ORDER BY v.visit_at ASC
  `
  return rows
}

export async function createVisit(data: {
  listing_id: string
  agency_id: string
  agent_id?: string | null
  visit_at: Date
  duration_minutes?: number
  visitor_name?: string | null
  visitor_phone?: string | null
  visitor_email?: string | null
  notes?: string | null
}): Promise<PropertyVisit> {
  const { rows } = await sql<PropertyVisit>`
    INSERT INTO property_visits
      (listing_id, agency_id, agent_id, visit_at, duration_minutes,
       visitor_name, visitor_phone, visitor_email, notes)
    VALUES
      (${data.listing_id}, ${data.agency_id}, ${data.agent_id ?? null},
       ${data.visit_at.toISOString()}, ${data.duration_minutes ?? 30},
       ${data.visitor_name ?? null}, ${data.visitor_phone ?? null},
       ${data.visitor_email ?? null}, ${data.notes ?? null})
    RETURNING *
  `
  return rows[0]
}

export async function updateVisitStatus(
  id: string,
  status: PropertyVisit['status'],
): Promise<PropertyVisit | null> {
  const { rows } = await sql<PropertyVisit>`
    UPDATE property_visits SET status = ${status} WHERE id = ${id} RETURNING *
  `
  return rows[0] ?? null
}

export async function deleteVisit(id: string): Promise<void> {
  await sql`DELETE FROM property_visits WHERE id = ${id}`
}
