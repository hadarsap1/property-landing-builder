import { sql, db } from '@/lib/db'
import type { Agency, Agent } from '@/lib/db/types'

function slugifyAgency(s: string): string {
  const latin = s.toLowerCase().trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
  // If all chars were stripped (e.g. Hebrew-only name), fall back to timestamp
  return latin || `agency-${Date.now().toString(36)}`
}

export async function generateUniqueAgencySlug(base: string): Promise<string> {
  let slug = slugifyAgency(base)
  let existing = await getAgencyBySlug(slug)
  let i = 2
  while (existing) {
    slug = `${slugifyAgency(base)}-${i++}`
    existing = await getAgencyBySlug(slug)
  }
  return slug
}

export async function getAgencyBySlug(slug: string): Promise<Agency | null> {
  const { rows } = await sql<Agency>`
    SELECT * FROM agencies WHERE slug = ${slug} LIMIT 1
  `
  return rows[0] ?? null
}

export async function getAgencyById(id: string): Promise<Agency | null> {
  const { rows } = await sql<Agency>`
    SELECT * FROM agencies WHERE id = ${id} LIMIT 1
  `
  return rows[0] ?? null
}

export async function getAgencyByCustomDomain(domain: string): Promise<Agency | null> {
  const { rows } = await sql<Agency>`
    SELECT * FROM agencies WHERE custom_domain = ${domain.toLowerCase()} LIMIT 1
  `
  return rows[0] ?? null
}

export const AGENCY_WRITABLE_COLUMNS = new Set([
  'name', 'logo_url', 'primary_color', 'secondary_color', 'contact_email', 'contact_phone', 'custom_domain',
])

export async function updateAgency(
  id: string,
  data: Partial<Pick<Agency, 'name' | 'logo_url' | 'primary_color' | 'secondary_color' | 'contact_email' | 'contact_phone' | 'custom_domain'>>
): Promise<Agency | null> {
  for (const key of Object.keys(data)) {
    if (!AGENCY_WRITABLE_COLUMNS.has(key) || !/^[a-z_]+$/.test(key))
      throw new Error(`Invalid agency column: ${key}`)
  }
  const entries = Object.entries(data).filter(([, v]) => v !== undefined)
  if (!entries.length) return getAgencyById(id)
  const sets = entries.map(([k], i) => `${k} = $${i + 1}`).join(', ')
  const values = entries.map(([, v]) => v)
  const { rows } = await db.query<Agency>(
    `UPDATE agencies SET ${sets} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id]
  )
  return rows[0] ?? null
}

/** Returns all agencies that have at least one active (password-set) agent, with their agent list. */
export async function getAllAgenciesForDigest(): Promise<Array<Agency & { agents: Agent[] }>> {
  const { rows: agencyRows } = await sql<Agency>`
    SELECT DISTINCT ON (a.id) a.*
    FROM agencies a
    JOIN agents ag ON ag.agency_id = a.id
    WHERE ag.password_hash IS NOT NULL
    ORDER BY a.id
  `
  if (!agencyRows.length) return []

  const agencyIds = agencyRows.map((a) => a.id)
  const { rows: agentRows } = await db.query<Agent>(
    `SELECT * FROM agents
     WHERE agency_id = ANY($1)
       AND password_hash IS NOT NULL
       AND email IS NOT NULL`,
    [agencyIds]
  )

  const agentsByAgency = new Map<string, Agent[]>()
  for (const agent of agentRows) {
    const arr = agentsByAgency.get(agent.agency_id) ?? []
    arr.push(agent)
    agentsByAgency.set(agent.agency_id, arr)
  }

  return agencyRows
    .filter((a) => agentsByAgency.has(a.id))
    .map((a) => ({ ...a, agents: agentsByAgency.get(a.id)! }))
}

export async function createAgency(data: {
  slug: string
  name: string
  primary_color?: string
  secondary_color?: string
  contact_email?: string
  contact_phone?: string
}): Promise<Agency> {
  const { rows } = await sql<Agency>`
    INSERT INTO agencies (slug, name, primary_color, secondary_color, contact_email, contact_phone)
    VALUES (
      ${data.slug},
      ${data.name},
      ${data.primary_color ?? null},
      ${data.secondary_color ?? null},
      ${data.contact_email ?? null},
      ${data.contact_phone ?? null}
    )
    RETURNING *
  `
  return rows[0]
}
