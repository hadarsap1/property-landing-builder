import { NextRequest, NextResponse } from 'next/server'

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? 'property-landing-builder.vercel.app'

export function proxy(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') ?? ''

  // Strip port for local dev (e.g. "remax-tlv.localhost:3000")
  const host = hostname.replace(/:.*$/, '')

  // Determine subdomain: everything before the first dot that isn't www
  const rootHost = ROOT_DOMAIN.replace(/:.*$/, '')
  const subdomain = host.endsWith(`.${rootHost}`)
    ? host.slice(0, host.length - rootHost.length - 1)
    : null

  // Agency subdomain — rewrite to /agency/[slug]/...
  if (subdomain && subdomain !== 'www') {
    url.pathname = `/agency/${subdomain}${url.pathname}`
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
