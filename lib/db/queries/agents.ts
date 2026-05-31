import { sql, db } from '@/lib/db'
import type { Agent } from '@/lib/db/types'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function getAgentByEmail(email: string): Promise<Agent | null> {
  const { rows } = await sql<Agent>`
    SELECT * FROM agents WHERE email = ${email} LIMIT 1
  `
  return rows[0] ?? null
}

export async function getAgentById(id: string): Promise<Agent | null> {
  const { rows } = await sql<Agent>`
    SELECT * FROM agents WHERE id = ${id} LIMIT 1
  `
  return rows[0] ?? null
}

export async function getAgentsByAgency(agencyId: string): Promise<Agent[]> {
  const { rows } = await sql<Agent>`
    SELECT * FROM agents WHERE agency_id = ${agencyId} ORDER BY created_at
  `
  return rows
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function createAgentWithInvite(data: {
  agency_id: string
  name: string
  email: string
  role?: 'admin' | 'agent'
  phone?: string | null
  calendly_url?: string | null
}): Promise<Agent & { raw_token: string }> {
  const raw_token = crypto.randomUUID()
  const expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 h

  const { rows } = await sql<Agent>`
    INSERT INTO agents (agency_id, name, email, role, phone, calendly_url, invitation_token, invitation_expires_at)
    VALUES (
      ${data.agency_id},
      ${data.name},
      ${data.email},
      ${data.role ?? 'agent'},
      ${data.phone ?? null},
      ${data.calendly_url ?? null},
      ${raw_token},
      ${expires_at.toISOString()}
    )
    RETURNING *
  `
  return { ...rows[0], raw_token }
}

export async function getAgentByInviteToken(token: string): Promise<Agent | null> {
  const { rows } = await sql<Agent>`
    SELECT * FROM agents
    WHERE invitation_token = ${token}
      AND invitation_expires_at > now()
    LIMIT 1
  `
  return rows[0] ?? null
}

export async function acceptInvitation(
  agentId: string,
  password: string
): Promise<Agent | null> {
  const hash = await bcrypt.hash(password, 12)
  const { rows } = await sql<Agent>`
    UPDATE agents
    SET password_hash = ${hash},
        invitation_token = NULL,
        invitation_expires_at = NULL
    WHERE id = ${agentId}
    RETURNING *
  `
  return rows[0] ?? null
}

export async function updateAgent(
  id: string,
  data: Partial<Pick<Agent, 'name' | 'phone' | 'photo_url' | 'calendly_url' | 'role'>>
): Promise<Agent | null> {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined)
  if (!entries.length) return getAgentById(id)
  const sets = entries.map(([k], i) => `${k} = $${i + 1}`).join(', ')
  const values = entries.map(([, v]) => v)
  const { rows } = await db.query<Agent>(
    `UPDATE agents SET ${sets} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id]
  )
  return rows[0] ?? null
}

export async function deleteAgent(id: string): Promise<void> {
  await sql`DELETE FROM agents WHERE id = ${id}`
}
