import { auth } from '@/auth'
import { getListingsByAgency } from '@/lib/db/queries/listings'
import { getAgencyById } from '@/lib/db/queries/agencies'
import Link from 'next/link'
import type { Listing } from '@/lib/db/types'

const STATUS_LABELS: Record<Listing['status'], string> = {
  active: 'פעיל',
  paused: 'מושהה',
  sold: 'נמכר',
}

const STATUS_COLORS: Record<Listing['status'], string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  sold: 'bg-gray-100 text-gray-500',
}

function formatPrice(price: number | null): string {
  if (!price) return '—'
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(price)
}

export default async function DashboardPage() {
  const session = await auth()
  const agencyId = session?.user?.agencyId
  if (!agencyId) return null

  const [listings, agency] = await Promise.all([
    getListingsByAgency(agencyId),
    getAgencyById(agencyId),
  ])

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
            <ListingCard key={listing.id} listing={listing} agencySlug={agency?.slug ?? ''} />
          ))}
        </div>
      )}
    </div>
  )
}

function ListingCard({ listing, agencySlug }: { listing: Listing; agencySlug: string }) {
  const address = [listing.street, listing.city].filter(Boolean).join(', ')
  const publicUrl = agencySlug ? `/agency/${agencySlug}/${listing.slug}` : null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
      {listing.hero_image_url ? (
        <img
          src={listing.hero_image_url}
          alt={listing.title ?? ''}
          className="w-16 h-16 rounded-xl object-cover shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl shrink-0">
          🏠
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 truncate">
            {listing.ai_title || listing.title || 'נכס ללא שם'}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[listing.status]}`}
          >
            {STATUS_LABELS[listing.status]}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5 truncate">{address || '—'}</p>
        <p className="text-sm font-medium text-gray-700 mt-0.5">
          {listing.price_on_request ? 'מחיר לפי פנייה' : formatPrice(listing.price)}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {publicUrl && (
          <Link
            href={publicUrl}
            target="_blank"
            className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            צפה
          </Link>
        )}
        <Link
          href={`/dashboard/listings/${listing.id}/edit`}
          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg px-3 py-1.5 font-medium transition-colors"
        >
          עריכה
        </Link>
      </div>
    </div>
  )
}
