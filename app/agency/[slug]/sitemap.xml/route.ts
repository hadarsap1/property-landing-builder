import { NextResponse } from 'next/server'
import { getAgencyBySlug } from '@/lib/db/queries/agencies'
import { getActiveListingSlugs } from '@/lib/db/queries/listings'

export const revalidate = 3600 // regenerate at most hourly

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? 'property-landing-builder.vercel.app'

function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Served as https://{slug}.{ROOT_DOMAIN}/sitemap.xml via the subdomain proxy rewrite.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params
  const agency = await getAgencyBySlug(slug)
  if (!agency) return new NextResponse('Not found', { status: 404 })

  const base = `https://${agency.custom_domain || `${slug}.${ROOT_DOMAIN}`}`
  const listings = await getActiveListingSlugs(agency.id)

  const urls = [
    `  <url><loc>${base}/</loc></url>`,
    ...listings.map(
      (l) =>
        `  <url><loc>${base}/listings/${xmlEscape(l.slug)}</loc><lastmod>${new Date(l.updated_at).toISOString()}</lastmod></url>`
    ),
  ].join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
