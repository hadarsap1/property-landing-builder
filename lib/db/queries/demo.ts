import { cache } from 'react'
import { sql } from '@/lib/db'

const DEMO_EMAIL = 'demo@propbuilder.dev'

export const getDemoAgencyId = cache(async (): Promise<string | null> => {
  const { rows } = await sql<{ agency_id: string | null }>`
    SELECT agency_id FROM agents WHERE email = ${DEMO_EMAIL} LIMIT 1
  `
  return rows[0]?.agency_id ?? null
})
