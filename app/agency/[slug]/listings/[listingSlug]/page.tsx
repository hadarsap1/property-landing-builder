import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getAgencyBySlug } from '@/lib/db/queries/agencies'
import { getListingBySlug } from '@/lib/db/queries/listings'
import { listingToProject } from '@/lib/listings/adapt'
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

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: 'website',
      ...(listing.hero_image_url ? { images: [listing.hero_image_url] } : {}),
    },
  }
}

export default async function ListingPage({ params }: Props) {
  const { slug, listingSlug } = await params

  const agency = await getAgencyBySlug(slug)
  if (!agency) notFound()

  const listing = await getListingBySlug(agency.id, listingSlug)
  if (!listing || listing.status === 'paused') notFound()

  const project = listingToProject(listing)

  return <PreviewContent project={project} listingId={listing.id} agencyId={agency.id} />
}
