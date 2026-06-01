import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // No secret required — shows only non-sensitive info
  return NextResponse.json({
    AUTH_URL_after_fix: process.env.AUTH_URL ?? '(not set)',
    AUTH_SECRET_set: !!process.env.AUTH_SECRET,
    GOOGLE_CLIENT_ID_set: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_ID_prefix: process.env.GOOGLE_CLIENT_ID?.slice(0, 12) ?? null,
    GOOGLE_CLIENT_SECRET_set: !!process.env.GOOGLE_CLIENT_SECRET,
    POSTGRES_URL_set: !!process.env.POSTGRES_URL,
    VERCEL_URL: process.env.VERCEL_URL ?? null,
    x_forwarded_host: req.headers.get('x-forwarded-host'),
    x_forwarded_proto: req.headers.get('x-forwarded-proto'),
    NODE_ENV: process.env.NODE_ENV,
    deployed_at: new Date().toISOString(),
  })
}
