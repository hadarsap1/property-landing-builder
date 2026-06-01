import { NextRequest, NextResponse } from 'next/server'

// Probe NextAuth's own assertConfig with our actual auth config to surface
// the EXACT error that's being thrown on every sign-in attempt.
export async function GET(req: NextRequest) {
  const results: Record<string, unknown> = {}

  try {
    // Re-import in this scope so we get a fresh module reference
    const auth = await import('@/auth')
    results.auth_module_loaded = true
    results.handlers_present = !!auth.handlers
    results.signIn_present = !!auth.signIn
  } catch (err) {
    results.auth_module_error = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    results.auth_module_stack = err instanceof Error ? err.stack?.split('\n').slice(0, 5).join('\n') : undefined
  }

  try {
    const { assertConfig } = await import('@auth/core/lib/utils/assert.js') as {
      assertConfig: (req: unknown, opts: unknown) => unknown
    }
    results.assertConfig_imported = true

    const host = req.headers.get('x-forwarded-host') || req.nextUrl.hostname
    const proto = req.headers.get('x-forwarded-proto') || 'https'
    const url = new URL(`${proto}://${host}/api/auth/signin`)

    const fakeInternalReq = {
      url,
      query: {},
      cookies: {},
      method: 'GET',
      action: 'signin',
    }

    const config = {
      trustHost: true,
      secret: process.env.AUTH_SECRET,
      providers: [
        {
          id: 'google',
          type: 'oidc',
          issuer: 'https://accounts.google.com',
          clientId: process.env.GOOGLE_CLIENT_ID ?? '',
          clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        },
      ],
      session: { strategy: 'jwt' },
    }

    const result = assertConfig(fakeInternalReq, config)
    if (Array.isArray(result)) {
      results.assertConfig_result = 'warnings'
      results.assertConfig_warnings = result
    } else if (result) {
      const e = result as { name?: string; type?: string; message?: string; constructor?: { name?: string } }
      results.assertConfig_result = 'error'
      results.assertConfig_error_type = e.type ?? e.constructor?.name ?? 'unknown'
      results.assertConfig_error_message = e.message
    } else {
      results.assertConfig_result = 'ok'
    }
  } catch (err) {
    results.assertConfig_probe_error = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
  }

  return NextResponse.json(results, { status: 200 })
}
