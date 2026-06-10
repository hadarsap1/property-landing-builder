import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAuthErrors } from '@/lib/auth-error-log'
import { sql } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!process.env.SUPER_ADMIN_EMAIL || session?.user?.email !== process.env.SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const inMemory = getAuthErrors()
  const dbRows = await sql`
    SELECT ts, data FROM auth_debug_log ORDER BY ts DESC LIMIT 20
  `.catch(() => ({ rows: [] as { ts: string; data: string }[] }))

  return NextResponse.json({
    in_memory: inMemory,
    from_db: (dbRows.rows as { ts: string; data: string }[]).map(r => {
      try { return { ts: r.ts, ...JSON.parse(r.data) } }
      catch { return { ts: r.ts, raw: r.data } }
    }),
  })
}
