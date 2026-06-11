import { NextResponse } from 'next/server'

export const revalidate = 86400

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? 'property-landing-builder.vercel.app'

// Served as https://{slug}.{ROOT_DOMAIN}/robots.txt via the subdomain proxy rewrite.
// Without this, subdomain robots.txt requests were rewritten to a non-existent
// /agency/{slug}/robots.txt page and returned 404.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params
  const body = [
    'User-Agent: *',
    'Allow: /',
    `Sitemap: https://${slug}.${ROOT_DOMAIN}/sitemap.xml`,
    '',
  ].join('\n')

  return new NextResponse(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
