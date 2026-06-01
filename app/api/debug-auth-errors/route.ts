import { NextResponse } from 'next/server'
import { getAuthErrors } from '@/lib/auth-error-log'
import { sql } from '@/lib/db'

export async function GET() {
  const inMemory = getAuthErrors()
  const dbRows = await sql`
    SELECT ts, data FROM auth_debug_log ORDER BY ts DESC LIMIT 20
  `.catch(() => ({ rows: [] as { ts: string; data: string }[] }))

  return NextResponse.json({
    in_memory: inMemory,
    from_db: dbRows.rows.map(r => {
      try { return { ts: r.ts, ...JSON.parse(r.data) } }
      catch { return { ts: r.ts, raw: r.data } }
    }),
  })
}
