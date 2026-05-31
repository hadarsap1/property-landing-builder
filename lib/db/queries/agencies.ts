import { sql } from '@/lib/db'
import type { Agency } from '@/lib/db/types'

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
