import { sql } from '@/lib/db'
import type { Agent } from '@/lib/db/types'
import bcrypt from 'bcryptjs'

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
    SELECT * FROM agents WHERE agency_id = ${agencyId} ORDER BY name
  `
  return rows
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}
