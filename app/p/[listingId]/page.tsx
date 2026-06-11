import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getListingById } from '@/lib/db/queries/listings'
import { getAgentById } from '@/lib/db/queries/agents'
import { listingToProject } from '@/lib/listings/adapt'
import { listingJsonLd } from '@/lib/listings/seo'
import PreviewContent from '@/app/preview/_preview-content'

export const revalidate = 60

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? 'property-landing-builder.vercel.app'

type Props = { params: Promise<{ listingId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { listingId } = await params
  const listing = await getListingById(listingId)
  if (!listing) return { title: 'נכס לא נמצא' }

  const title = listing.ai_title || listing.title || 'נכס למכירה'
  const city = listing.city ? ` — ${listing.city}` : ''
  const desc = listing.ai_tagline || `${listing.rooms ?? ''} חדרים${city}`
  const canonical = `https://${ROOT_DOMAIN}/p/${listingId}`

  return {
    title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title,
      description: desc,
      type: 'website',
      url: canonical,
      locale: 'he_IL',
      ...(listing.hero_image_url ? { images: [listing.hero_image_url] } : {}),
    },
    twitter: {
      card: listing.hero_image_url ? 'summary_large_image' : 'summary',
      title,
      description: desc,
      ...(listing.hero_image_url ? { images: [listing.hero_image_url] } : {}),
    },
  }
}

export default async function PersonalListingPage({ params }: Props) {
  const { listingId } = await params

  const listing = await getListingById(listingId)
  if (!listing || listing.status === 'paused' || listing.status === 'sold') notFound()

  const project = listingToProject(listing)
  const agent = listing.agent_id ? await getAgentById(listing.agent_id) : null
  const jsonLd = listingJsonLd(listing, null, `https://${ROOT_DOMAIN}/p/${listingId}`)

  return (
    <>
      <script
        type="application/ld+json"
        // Escape < so listing text can never break out of the script tag
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <PreviewContent
        project={project}
        listingId={listing.id}
        agencyId={listing.agency_id ?? undefined}
        calendlyUrl={agent?.calendly_url ?? null}
      />
    </>
  )
}
