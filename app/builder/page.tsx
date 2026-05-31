import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getListingById } from '@/lib/db/queries/listings'
import { getAgencyById } from '@/lib/db/queries/agencies'
import { listingToProject } from '@/lib/listings/adapt'
import BuilderClient from './_builder-client'
import type { PropertyProject } from '@/types/project'

export default async function BuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const session = await auth()
  if (!session) {
    redirect('/auth/login?callbackUrl=/builder')
  }

  const agencyId = session.user?.agencyId ?? ''
  const { id } = await searchParams

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
    if (listing && listing.agency_id === agencyId) {
      listingId = listing.id
      listingSlug = listing.slug
      initialProject = listingToProject(listing)
    }
  }

  return (
    <BuilderClient
      agencyId={agencyId}
      agencySlug={agencySlug}
      listingId={listingId}
      listingSlug={listingSlug}
      initialProject={initialProject}
    />
  )
}
