import { handlers } from '@/auth'
import type { NextRequest } from 'next/server'

// next-auth's reqWithEnvURL() rewrites every request's origin to AUTH_URL.
// We set AUTH_URL to exactly match the incoming request host on every call,
// so the redirect_uri Google receives always matches the domain in use.
type H = (req: NextRequest, ctx: unknown) => Response | Promise<Response>

function withDynamicAuthUrl(h: H): H {
  return (req, ctx) => {
    const host = req.headers.get('x-forwarded-host') || req.nextUrl.hostname
    const proto = req.headers.get('x-forwarded-proto') || 'https'
    process.env.AUTH_URL = `${proto}://${host}`
    return h(req, ctx)
  }
}

export const GET = withDynamicAuthUrl(handlers.GET as H)
export const POST = withDynamicAuthUrl(handlers.POST as H)
