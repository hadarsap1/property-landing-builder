import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getListingById } from '@/lib/db/queries/listings'
import { getAgencyById } from '@/lib/db/queries/agencies'
import { listingToProject } from '@/lib/listings/adapt'
import { isAgencyActive } from '@/lib/billing/access'
import BuilderClient from './_builder-client'
import type { PropertyProject } from '@/types/project'

export default async function BuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const session = await auth()
  const { id } = await searchParams

  const agencyId = session?.user?.agencyId ?? ''
  const personalUserId = session?.user?.personalUserId ?? ''

  // Commercial users with a lapsed subscription go to billing
  if (agencyId && !await isAgencyActive(agencyId)) {
    redirect('/dashboard/billing')
  }

  let listingId: string | null = null
  let listingSlug: string | null = null
  let initialProject: PropertyProject | null = null
  let agencySlug = ''

  if (agencyId) {
    const agency = await getAgencyById(agencyId)
    agencySlug = agency?.slug ?? ''
  }

  if (id) {
    const listing = await getListingById(id)
    if (listing) {
      const ownsIt =
        (agencyId && listing.agency_id === agencyId) ||
        (personalUserId && listing.user_id === personalUserId) ||
        (!listing.agency_id && !listing.user_id)
      if (ownsIt) {
        listingId = listing.id
        listingSlug = listing.slug
        initialProject = listingToProject(listing)
      }
    }
  }

  const isLoggedIn = !!(agencyId || personalUserId)

  return (
    <BuilderClient
      agencyId={agencyId}
      agencySlug={agencySlug}
      personalUserId={personalUserId}
      listingId={listingId}
      listingSlug={listingSlug}
      initialProject={initialProject}
      isLoggedIn={isLoggedIn}
    />
  )
}
