import { sql, db } from '@/lib/db'
import type { Agency } from '@/lib/db/types'

function slugifyAgency(s: string): string {
  return s.toLowerCase().trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '') || 'agency'
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

export async function updateAgency(
  id: string,
  data: Partial<Pick<Agency, 'name' | 'logo_url' | 'primary_color' | 'secondary_color' | 'contact_email' | 'contact_phone'>>
): Promise<Agency | null> {
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
