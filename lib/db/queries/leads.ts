import { sql, db } from '@/lib/db'
import type { Lead, LeadNote } from '@/lib/db/types'

export type LeadWithListing = Lead & {
  listing_title: string | null
  listing_slug: string | null
  listing_city: string | null
  open_house_date: Date | null
  open_house_end: Date | null
}

export type OpenHouseReminderLead = Lead & {
  listing_title: string | null
  listing_slug: string | null
  listing_city: string | null
  listing_street: string | null
  open_house_date: Date
  agency_slug: string
  agency_custom_domain: string | null
  agency_name: string
}

export async function createLead(data: {
  listing_id?: string | null
  agency_id: string
  name?: string | null
  phone?: string | null
  email?: string | null
  source: Lead['source']
  budget?: number | null
  rooms_min?: number | null
  rooms_max?: number | null
  desired_areas?: string | null
}): Promise<Lead> {
  const { rows } = await sql<Lead>`
    INSERT INTO leads (listing_id, agency_id, name, phone, email, source, budget, rooms_min, rooms_max, desired_areas)
    VALUES (
      ${data.listing_id ?? null},
      ${data.agency_id},
      ${data.name ?? null},
      ${data.phone ?? null},
      ${data.email ?? null},
      ${data.source},
      ${data.budget ?? null},
      ${data.rooms_min ?? null},
      ${data.rooms_max ?? null},
      ${data.desired_areas ?? null}
    )
    RETURNING *
  `
  return rows[0]
}

export async function getLeadsByAgency(
  agencyId: string,
  filters: { listingId?: string; status?: Lead['status']; limit?: number; offset?: number } = {}
): Promise<LeadWithListing[]> {
  const conditions: string[] = ['l.agency_id = $1']
  const values: (string | number | null)[] = [agencyId]

  if (filters.listingId) {
    values.push(filters.listingId)
    conditions.push(`l.listing_id = $${values.length}`)
  }
  if (filters.status) {
    values.push(filters.status)
    conditions.push(`l.status = $${values.length}`)
  }

  const limit = filters.limit ?? 100
  const offset = filters.offset ?? 0
  values.push(limit, offset)
  const limitIdx = values.length - 1
  const offsetIdx = values.length

  const { rows } = await db.query<LeadWithListing>(
    `SELECT l.*,
       COALESCE(li.ai_title, li.title) AS listing_title,
       li.slug AS listing_slug,
       li.city AS listing_city,
       li.open_house_date,
       li.open_house_end
     FROM leads l
     LEFT JOIN listings li ON li.id = l.listing_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY l.created_at DESC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    values
  )
  return rows
}

export async function getLeadById(id: string): Promise<LeadWithListing | null> {
  const { rows } = await sql<LeadWithListing>`
    SELECT l.*,
       COALESCE(li.ai_title, li.title) AS listing_title,
       li.slug AS listing_slug,
       li.city AS listing_city,
       li.open_house_date,
       li.open_house_end
     FROM leads l
     LEFT JOIN listings li ON li.id = l.listing_id
     WHERE l.id = ${id}
     LIMIT 1
  `
  return rows[0] ?? null
}

export async function updateLeadStatus(
  id: string,
  status: Lead['status']
): Promise<Lead | null> {
  const { rows } = await sql<Lead>`
    UPDATE leads
    SET status = ${status}, last_interaction = now()
    WHERE id = ${id}
    RETURNING *
  `
  return rows[0] ?? null
}

export async function addLeadNote(data: {
  lead_id: string
  agent_id?: string | null
  note: string
  follow_up_at?: Date | null
}): Promise<LeadNote> {
  const { rows } = await sql<LeadNote>`
    INSERT INTO lead_notes (lead_id, agent_id, note, follow_up_at)
    VALUES (
      ${data.lead_id},
      ${data.agent_id ?? null},
      ${data.note},
      ${data.follow_up_at?.toISOString() ?? null}
    )
    RETURNING *
  `
  // Touch last_interaction on the lead
  await sql`UPDATE leads SET last_interaction = now() WHERE id = ${data.lead_id}`
  return rows[0]
}

export async function getLeadNotes(leadId: string): Promise<LeadNote[]> {
  const { rows } = await sql<LeadNote>`
    SELECT * FROM lead_notes WHERE lead_id = ${leadId} ORDER BY created_at DESC LIMIT 200
  `
  return rows
}

export async function markFollowUpDone(noteId: string): Promise<LeadNote | null> {
  const { rows } = await sql<LeadNote>`
    UPDATE lead_notes
    SET follow_up_done = true
    WHERE id = ${noteId}
    RETURNING *
  `
  return rows[0] ?? null
}

export async function countPendingFollowUps(agencyId: string): Promise<number> {
  const { rows } = await sql<{ count: string }>`
    SELECT COUNT(*) AS count
    FROM lead_notes ln
    JOIN leads l ON l.id = ln.lead_id
    WHERE l.agency_id = ${agencyId}
      AND ln.follow_up_done = false
      AND ln.follow_up_at IS NOT NULL
      AND ln.follow_up_at <= now()
  `
  return parseInt(rows[0]?.count ?? '0', 10)
}

/** Returns open-house leads with email addresses whose listing opens tomorrow (UTC day). */
export async function getOpenHouseLeadsForTomorrow(
  referenceDate?: Date
): Promise<OpenHouseReminderLead[]> {
  const ref = referenceDate ?? new Date()
  const tomorrow = new Date(ref)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  const dayStart = `${tomorrow.toISOString().slice(0, 10)}T00:00:00`
  const dayEnd = `${tomorrow.toISOString().slice(0, 10)}T23:59:59`

  const { rows } = await db.query<OpenHouseReminderLead>(
    `SELECT l.*,
       COALESCE(li.ai_title, li.title) AS listing_title,
       li.slug AS listing_slug,
       li.city AS listing_city,
       li.street AS listing_street,
       li.open_house_date,
       a.slug AS agency_slug,
       a.custom_domain AS agency_custom_domain,
       a.name AS agency_name
     FROM leads l
     JOIN listings li ON li.id = l.listing_id
     JOIN agencies a ON a.id = l.agency_id
     WHERE l.source = 'open_house'
       AND l.email IS NOT NULL
       AND l.open_house_reminder_sent_at IS NULL
       AND li.open_house_date >= $1
       AND li.open_house_date <= $2
     LIMIT 1000`,
    [dayStart, dayEnd]
  )
  return rows
}

export async function markOpenHouseReminderSent(leadId: string): Promise<void> {
  await sql`UPDATE leads SET open_house_reminder_sent_at = now() WHERE id = ${leadId}`
}
