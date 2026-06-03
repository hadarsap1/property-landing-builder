import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getListingById } from '@/lib/db/queries/listings'
import { getAgentById } from '@/lib/db/queries/agents'
import { listingToProject } from '@/lib/listings/adapt'
import PreviewContent from '@/app/preview/_preview-content'

export const revalidate = 60

type Props = { params: Promise<{ listingId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { listingId } = await params
  const listing = await getListingById(listingId)
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

export default async function PersonalListingPage({ params }: Props) {
  const { listingId } = await params

  const listing = await getListingById(listingId)
  if (!listing || listing.status === 'paused' || listing.status === 'sold') notFound()

  const project = listingToProject(listing)
  const agent = listing.agent_id ? await getAgentById(listing.agent_id) : null

  return (
    <PreviewContent
      project={project}
      listingId={listing.id}
      agencyId={listing.agency_id ?? undefined}
      calendlyUrl={agent?.calendly_url ?? null}
    />
  )
}
