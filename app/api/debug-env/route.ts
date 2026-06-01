import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  return NextResponse.json({
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL ?? null,
    GOOGLE_CLIENT_ID_set: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_ID_prefix: process.env.GOOGLE_CLIENT_ID?.slice(0, 8) ?? null,
    GOOGLE_CLIENT_SECRET_set: !!process.env.GOOGLE_CLIENT_SECRET,
    POSTGRES_URL_set: !!process.env.POSTGRES_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? null,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_URL: process.env.VERCEL_URL ?? null,
  })
}
