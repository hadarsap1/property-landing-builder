import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { sql } from '@/lib/db'

interface Row { current_database: string; inet_server_addr: string | null; n: string }

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!process.env.SUPER_ADMIN_EMAIL || session?.user?.email !== process.env.SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const host = req.headers.get('x-forwarded-host') || req.nextUrl.hostname
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  const origin = `${proto}://${host}`

  const dbInfo = await sql<Row>`
    SELECT current_database()::text AS current_database,
           inet_server_addr()::text AS inet_server_addr,
           (SELECT COUNT(*) FROM listings)::text AS n
  `.then(r => ({
    current_database: r.rows[0]?.current_database ?? null,
    listings_count:   parseInt(r.rows[0]?.n ?? '0', 10),
  })).catch((e: Error) => ({ error: e.message }))

  const tableCounts = await sql<{ table_name: string; n: string }>`
    SELECT 'agencies' AS table_name, COUNT(*)::text AS n FROM agencies UNION ALL
    SELECT 'personal_users',         COUNT(*)::text FROM personal_users UNION ALL
    SELECT 'agents',                 COUNT(*)::text FROM agents UNION ALL
    SELECT 'listings',               COUNT(*)::text FROM listings UNION ALL
    SELECT 'leads',                  COUNT(*)::text FROM leads UNION ALL
    SELECT 'analytics_events',       COUNT(*)::text FROM analytics_events
  `
    .then(r => Object.fromEntries(r.rows.map(x => [x.table_name, parseInt(x.n, 10)])))
    .catch((e: Error) => ({ error: e.message }))

  return NextResponse.json({
    redirect_uri_sent_to_google: `${origin}/api/auth/callback/google`,
    AUTH_SECRET_set: !!process.env.AUTH_SECRET,
    GOOGLE_CLIENT_ID_set: !!process.env.GOOGLE_CLIENT_ID,
    POSTGRES_URL_set: !!process.env.POSTGRES_URL,
    db_info: dbInfo,
    table_counts: tableCounts,
    NEXTAUTH_URL_raw: process.env.NEXTAUTH_URL ?? '(undefined)',
    SUPER_ADMIN_EMAIL_set: !!process.env.SUPER_ADMIN_EMAIL,
    VERCEL_ENV: process.env.VERCEL_ENV ?? null,
    NODE_ENV: process.env.NODE_ENV,
    detected_origin: origin,
  })
}
