import { NextRequest, NextResponse } from 'next/server'

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? 'property-landing-builder.vercel.app'

// Custom-domain → agency-slug cache. Edge isolates are short-lived, so a
// small TTL keeps DB lookups to roughly one per isolate per domain.
const domainCache = new Map<string, { slug: string | null; expires: number }>()
const DOMAIN_TTL_MS = 5 * 60_000

async function slugForCustomDomain(host: string): Promise<string | null> {
  const cached = domainCache.get(host)
  if (cached && cached.expires > Date.now()) return cached.slug

  let slug: string | null = null
  try {
    // Direct @vercel/postgres import — edge-compatible (fetch-based), and
    // avoids lib/db's node-postgres fallback which can't bundle for edge.
    const { sql } = await import('@vercel/postgres')
    const { rows } = await sql<{ slug: string }>`
      SELECT slug FROM agencies WHERE custom_domain = ${host} LIMIT 1
    `
    slug = rows[0]?.slug ?? null
  } catch {
    // DB unreachable — treat as unknown domain rather than erroring the edge
    slug = null
  }
  domainCache.set(host, { slug, expires: Date.now() + DOMAIN_TTL_MS })
  return slug
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') ?? ''

  // Strip port for local dev (e.g. "remax-tlv.localhost:3000")
  const host = hostname.replace(/:.*$/, '')

  // Determine subdomain: everything before the first dot that isn't www
  const rootHost = ROOT_DOMAIN.replace(/:.*$/, '')
  const subdomain = host.endsWith(`.${rootHost}`)
    ? host.slice(0, host.length - rootHost.length - 1)
    : null

  // Forward the original pathname to server components via REQUEST headers
  // (response headers aren't visible to headers() in server components).
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  // Agency subdomain — rewrite to /agency/[slug]/...
  if (subdomain && subdomain !== 'www') {
    url.pathname = `/agency/${subdomain}${url.pathname}`
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } })
  }

  // Custom agency domain (e.g. listings.my-agency.co.il) — anything that is
  // neither the root domain nor one of its subdomains nor localhost.
  const isPlatformHost =
    host === rootHost || host === `www.${rootHost}` ||
    host === 'localhost' || host.endsWith('.localhost') || /^[\d.]+$/.test(host)
  if (!isPlatformHost && host) {
    const slug = await slugForCustomDomain(host)
    if (slug) {
      url.pathname = `/agency/${slug}${url.pathname}`
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } })
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
