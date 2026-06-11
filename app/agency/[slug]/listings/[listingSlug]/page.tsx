import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getAgencyBySlug } from '@/lib/db/queries/agencies'
import { getListingBySlug } from '@/lib/db/queries/listings'
import { getAgentById } from '@/lib/db/queries/agents'
import { listingToProject } from '@/lib/listings/adapt'
import { listingCanonicalUrl, listingJsonLd } from '@/lib/listings/seo'
import PreviewContent from '@/app/preview/_preview-content'

export const revalidate = 60 // cache for 60 s; paused/sold listings go dark within a minute

type Props = { params: Promise<{ slug: string; listingSlug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, listingSlug } = await params
  const agency = await getAgencyBySlug(slug)
  if (!agency) return {}
  const listing = await getListingBySlug(agency.id, listingSlug)
  if (!listing) return { title: 'נכס לא נמצא' }

  const title = listing.ai_title || listing.title || 'נכס למכירה'
  const city = listing.city ? ` — ${listing.city}` : ''
  const desc = listing.ai_tagline || `${listing.rooms ?? ''} חדרים${city}`
  const canonical = listingCanonicalUrl(slug, listingSlug)

  return {
    title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title,
      description: desc,
      type: 'website',
      url: canonical,
      siteName: agency.name,
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

export default async function ListingPage({ params }: Props) {
  const { slug, listingSlug } = await params

  const agency = await getAgencyBySlug(slug)
  if (!agency) notFound()

  const listing = await getListingBySlug(agency.id, listingSlug)
  if (!listing || listing.status === 'paused' || listing.status === 'sold') notFound()

  const project = listingToProject(listing)
  const agent = listing.agent_id ? await getAgentById(listing.agent_id) : null
  const jsonLd = listingJsonLd(listing, agency, listingCanonicalUrl(slug, listingSlug))

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
        agencyId={agency.id}
        agencyLogoUrl={agency.logo_url}
        agencyName={agency.name}
        calendlyUrl={agent?.calendly_url ?? null}
      />
    </>
  )
}
