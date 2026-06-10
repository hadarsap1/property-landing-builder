import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getListingById } from '@/lib/db/queries/listings'
import { getAgencyById } from '@/lib/db/queries/agencies'
import { listingToProject } from '@/lib/listings/adapt'
import { isAgencyActive } from '@/lib/billing/access'
import { sql } from '@/lib/db'
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
      const ownerless = !listing.agency_id && !listing.user_id
      const ownsIt =
        (agencyId && listing.agency_id === agencyId) ||
        (personalUserId && listing.user_id === personalUserId) ||
        ownerless
      if (ownsIt) {
        // Claim an anonymous listing when an authenticated user loads it —
        // this links it to their account so it appears in their dashboard.
        if (ownerless && (agencyId || personalUserId)) {
          if (agencyId) {
            await sql`UPDATE listings SET agency_id = ${agencyId} WHERE id = ${listing.id} AND agency_id IS NULL AND user_id IS NULL`
          } else {
            await sql`UPDATE listings SET user_id = ${personalUserId} WHERE id = ${listing.id} AND agency_id IS NULL AND user_id IS NULL`
          }
        }
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
