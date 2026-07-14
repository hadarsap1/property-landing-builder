import { sql, db } from '@/lib/db'
import type { Lead, LeadNote } from '@/lib/db/types'

export async function createLead(data: {
  listing_id: string
  agency_id: string
  name?: string | null
  phone?: string | null
  email?: string | null
  source: Lead['source']
  marketing_consent?: boolean
  consent_source?: string | null
  privacy_policy_version?: string | null
}): Promise<Lead> {
  const marketingConsent = data.marketing_consent ?? false
  try {
    const { rows } = await sql<Lead>`
      INSERT INTO leads (
        listing_id, agency_id, name, phone, email, source,
        marketing_consent, marketing_consent_at, consent_source, privacy_policy_version
      )
      VALUES (
        ${data.listing_id},
        ${data.agency_id},
        ${data.name ?? null},
        ${data.phone ?? null},
        ${data.email ?? null},
        ${data.source},
        ${marketingConsent},
        ${marketingConsent ? new Date().toISOString() : null},
        ${data.consent_source ?? null},
        ${data.privacy_policy_version ?? null}
      )
      RETURNING *
    `
    return rows[0]
  } catch (err) {
    // Deploy-ordering guard: if the consent columns haven't been migrated yet
    // (setup-db not run), fall back to the legacy insert so no lead is lost.
    const msg = err instanceof Error ? err.message : String(err)
    if (!/column .* does not exist/i.test(msg)) throw err
    console.error('leads: consent columns missing — run /api/admin/setup-db. Falling back to legacy insert.')
    const { rows } = await sql<Lead>`
      INSERT INTO leads (listing_id, agency_id, name, phone, email, source)
      VALUES (
        ${data.listing_id},
        ${data.agency_id},
        ${data.name ?? null},
        ${data.phone ?? null},
        ${data.email ?? null},
        ${data.source}
      )
      RETURNING *
    `
    return rows[0]
  }
}

export async function getLeadsByAgency(
  agencyId: string,
  filters: { listingId?: string; status?: Lead['status'] } = {}
): Promise<Lead[]> {
  const conditions: string[] = ['agency_id = $1']
  const values: (string | null)[] = [agencyId]

  if (filters.listingId) {
    values.push(filters.listingId)
    conditions.push(`listing_id = $${values.length}`)
  }
  if (filters.status) {
    values.push(filters.status)
    conditions.push(`status = $${values.length}`)
  }

  const { rows } = await db.query<Lead>(
    `SELECT * FROM leads WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
    values
  )
  return rows
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const { rows } = await sql<Lead>`
    SELECT * FROM leads WHERE id = ${id} LIMIT 1
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
    SELECT * FROM lead_notes WHERE lead_id = ${leadId} ORDER BY created_at DESC
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
