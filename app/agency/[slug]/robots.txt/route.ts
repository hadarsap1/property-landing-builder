import { NextResponse } from 'next/server'
import { getAgencyBySlug } from '@/lib/db/queries/agencies'

export const revalidate = 86400

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? 'property-landing-builder.vercel.app'

// Served as https://{slug}.{ROOT_DOMAIN}/robots.txt (and on custom domains)
// via the proxy rewrite. Without this, subdomain robots.txt requests were
// rewritten to a non-existent /agency/{slug}/robots.txt page and returned 404.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params
  const agency = await getAgencyBySlug(slug)
  const host = agency?.custom_domain || `${slug}.${ROOT_DOMAIN}`
  const body = [
    'User-Agent: *',
    'Allow: /',
    `Sitemap: https://${host}/sitemap.xml`,
    '',
  ].join('\n')

  return new NextResponse(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
