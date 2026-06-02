import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

interface Row { current_database: string; inet_server_addr: string | null; n: string }

export async function GET(req: NextRequest) {
  const host = req.headers.get('x-forwarded-host') || req.nextUrl.hostname
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  const origin = `${proto}://${host}`

  // DB identity + table counts — verifies which DB the running deployment is talking to
  const dbInfo = await sql<Row>`
    SELECT current_database()::text AS current_database,
           inet_server_addr()::text AS inet_server_addr,
           (SELECT COUNT(*) FROM listings)::text AS n
  `.then(r => ({
    current_database: r.rows[0]?.current_database ?? null,
    inet_server_addr: r.rows[0]?.inet_server_addr ?? null,
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
    AUTH_SECRET_length: process.env.AUTH_SECRET?.length ?? 0,
    GOOGLE_CLIENT_ID_set: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_ID_length: process.env.GOOGLE_CLIENT_ID?.length ?? 0,
    GOOGLE_CLIENT_ID_prefix: (process.env.GOOGLE_CLIENT_ID ?? '').slice(0, 12),
    GOOGLE_CLIENT_SECRET_set: !!process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CLIENT_SECRET_length: process.env.GOOGLE_CLIENT_SECRET?.length ?? 0,
    POSTGRES_URL_set: !!process.env.POSTGRES_URL,
    POSTGRES_URL_host: (() => {
      try { return process.env.POSTGRES_URL ? new URL(process.env.POSTGRES_URL).host : null }
      catch { return '(unparseable)' }
    })(),
    db_info: dbInfo,
    table_counts: tableCounts,
    AUTH_URL_raw: process.env.AUTH_URL ?? '(undefined)',
    NEXTAUTH_URL_raw: process.env.NEXTAUTH_URL ?? '(undefined)',
    NEXTAUTH_SECRET_set: !!process.env.NEXTAUTH_SECRET,
    SUPER_ADMIN_EMAIL_set: !!process.env.SUPER_ADMIN_EMAIL,
    VERCEL: process.env.VERCEL ?? null,
    VERCEL_URL: process.env.VERCEL_URL ?? null,
    VERCEL_ENV: process.env.VERCEL_ENV ?? null,
    VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    NODE_ENV: process.env.NODE_ENV,
    x_forwarded_host: req.headers.get('x-forwarded-host'),
    x_forwarded_proto: req.headers.get('x-forwarded-proto'),
    host_header: req.headers.get('host'),
    detected_origin: origin,
  })
}
