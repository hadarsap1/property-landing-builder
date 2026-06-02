import { sql } from '@/lib/db'
import type { PersonalUser } from '@/lib/db/types'

export async function upsertPersonalUser(data: {
  email: string
  name?: string | null
  photo_url?: string | null
}): Promise<PersonalUser> {
  // Avoid ON CONFLICT in case the UNIQUE constraint doesn't exist yet on older DBs.
  const existing = await getPersonalUserByEmail(data.email)
  if (existing) {
    const { rows } = await sql<PersonalUser>`
      UPDATE personal_users
      SET name      = COALESCE(${data.name ?? null}, name),
          photo_url = COALESCE(${data.photo_url ?? null}, photo_url)
      WHERE email = ${data.email}
      RETURNING *
    `
    return rows[0] ?? existing
  }
  const { rows } = await sql<PersonalUser>`
    INSERT INTO personal_users (email, name, photo_url)
    VALUES (${data.email}, ${data.name ?? null}, ${data.photo_url ?? null})
    RETURNING *
  `
  return rows[0]
}

export async function getPersonalUserById(id: string): Promise<PersonalUser | null> {
  const { rows } = await sql<PersonalUser>`
    SELECT * FROM personal_users WHERE id = ${id} LIMIT 1
  `
  return rows[0] ?? null
}

export async function getPersonalUserByEmail(email: string): Promise<PersonalUser | null> {
  const { rows } = await sql<PersonalUser>`
    SELECT * FROM personal_users WHERE email = ${email} LIMIT 1
  `
  return rows[0] ?? null
}

export async function upgradePersonalUser(
  id: string,
  agencyId: string
): Promise<PersonalUser | null> {
  const { rows } = await sql<PersonalUser>`
    UPDATE personal_users
    SET plan = 'commercial', agency_id = ${agencyId}
    WHERE id = ${id}
    RETURNING *
  `
  return rows[0] ?? null
}

export async function getAllPersonalUsers(): Promise<PersonalUser[]> {
  const { rows } = await sql<PersonalUser>`
    SELECT * FROM personal_users ORDER BY created_at DESC
  `
  return rows
}
