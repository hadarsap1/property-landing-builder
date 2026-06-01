import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const host = req.headers.get('x-forwarded-host') || req.nextUrl.hostname
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  const origin = `${proto}://${host}`

  // This is the EXACT redirect_uri next-auth sends to Google
  const redirectUri = `${origin}/api/auth/callback/google`

  // Show enough of the client ID to identify which Google OAuth client is in use
  const clientId = process.env.GOOGLE_CLIENT_ID ?? ''

  return NextResponse.json({
    redirect_uri_sent_to_google: redirectUri,
    google_client_id_full: clientId,   // public info — appears in browser URL bar
    AUTH_URL: process.env.AUTH_URL ?? '(not set)',
    x_forwarded_host: req.headers.get('x-forwarded-host'),
    VERCEL_URL: process.env.VERCEL_URL ?? null,
  })
}
