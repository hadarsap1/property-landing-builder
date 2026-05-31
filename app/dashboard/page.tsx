import { auth } from '@/auth'
import { getListingsByAgency } from '@/lib/db/queries/listings'
import { getAgencyById } from '@/lib/db/queries/agencies'
import { getActivePendingCountsByListings } from '@/lib/db/queries/pending-changes'
import Link from 'next/link'
import { ListingCard } from './_listing-card'

export default async function DashboardPage() {
  const session = await auth()
  const agencyId = session?.user?.agencyId
  if (!agencyId) return null

  const [listings, agency] = await Promise.all([
    getListingsByAgency(agencyId),
    getAgencyById(agencyId),
  ])

  const pendingCounts = await getActivePendingCountsByListings(listings.map(l => l.id))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {agency?.name ?? 'הנכסים שלי'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{listings.length} נכסים</p>
        </div>
        <Link
          href="/builder"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          + נכס חדש
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">🏠</div>
          <p className="text-sm">עדיין אין נכסים. צור את הראשון!</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              agencySlug={agency?.slug ?? ''}
              pendingChanges={pendingCounts[listing.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
