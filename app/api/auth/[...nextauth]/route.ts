import { handlers } from '@/auth'
import type { NextRequest } from 'next/server'

// next-auth's reqWithEnvURL() rewrites every request's origin to AUTH_URL.
// If AUTH_URL points to the wrong domain (common in multi-project Vercel setups)
// every OAuth callback breaks. We clear it on EVERY request so next-auth always
// uses the real incoming host. trustHost:true in auth.ts accepts that host.
type H = (req: NextRequest, ctx: unknown) => Response | Promise<Response>

function withClearedAuthUrl(h: H): H {
  return (req, ctx) => {
    process.env.AUTH_URL = ''
    return h(req, ctx)
  }
}

export const GET = withClearedAuthUrl(handlers.GET as H)
export const POST = withClearedAuthUrl(handlers.POST as H)
