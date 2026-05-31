import { sql } from '@/lib/db'
import type { PersonalUser } from '@/lib/db/types'

export async function upsertPersonalUser(data: {
  email: string
  name?: string | null
  photo_url?: string | null
}): Promise<PersonalUser> {
  const { rows } = await sql<PersonalUser>`
    INSERT INTO personal_users (email, name, photo_url)
    VALUES (${data.email}, ${data.name ?? null}, ${data.photo_url ?? null})
    ON CONFLICT (email) DO UPDATE SET
      name      = COALESCE(EXCLUDED.name, personal_users.name),
      photo_url = COALESCE(EXCLUDED.photo_url, personal_users.photo_url)
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
