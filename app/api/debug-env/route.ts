import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const host = req.headers.get('x-forwarded-host') || req.nextUrl.hostname
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  const origin = `${proto}://${host}`

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
    AUTH_URL_raw: process.env.AUTH_URL ?? '(undefined)',
    NEXTAUTH_URL_raw: process.env.NEXTAUTH_URL ?? '(undefined)',
    NEXTAUTH_SECRET_set: !!process.env.NEXTAUTH_SECRET,
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
