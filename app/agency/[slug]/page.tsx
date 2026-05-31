import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAgencyBySlug } from '@/lib/db/queries/agencies'
import { getListingsByAgency } from '@/lib/db/queries/listings'
import { isAgencyActive } from '@/lib/billing/access'
import type { Listing } from '@/lib/db/types'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const agency = await getAgencyBySlug(slug)
  if (!agency) return { title: 'סוכנות לא נמצאה' }
  return { title: `${agency.name} — נכסים`, description: `כל הנכסים של ${agency.name}` }
}

export default async function AgencyPage({ params }: Props) {
  const { slug } = await params
  const agency = await getAgencyBySlug(slug)
  if (!agency) notFound()

  const active_subscription = await isAgencyActive(agency.id)
  if (!active_subscription) notFound()

  const listings = await getListingsByAgency(agency.id)
  const active = listings.filter((l) => l.status === 'active')

  return (
    <main className="min-h-screen bg-gray-50" dir="rtl">
      <header
        className="text-white py-10 px-4 text-center"
        style={{ background: agency.primary_color ?? '#1e3a5f' }}
      >
        {agency.logo_url && (
          <img src={agency.logo_url} alt={agency.name} className="h-12 mx-auto mb-4 object-contain" />
        )}
        <h1 className="text-2xl font-bold">{agency.name}</h1>
        <p className="text-sm opacity-80 mt-1">{active.length} נכסים פעילים</p>
      </header>

      <section className="max-w-4xl mx-auto px-4 py-8">
        {active.length === 0 ? (
          <p className="text-center text-gray-400 py-20">אין נכסים פעילים כרגע</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {active.map((listing) => (
              <ListingPreviewCard
                key={listing.id}
                listing={listing}
                agencySlug={agency.slug}
                accentColor={agency.primary_color ?? undefined}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function ListingPreviewCard({
  listing,
  agencySlug,
  accentColor,
}: {
  listing: Listing
  agencySlug: string
  accentColor?: string
}) {
  const address = [listing.street, listing.city].filter(Boolean).join(', ')

  return (
    <Link
      href={`/agency/${agencySlug}/${listing.slug}`}
      className="block bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      {listing.hero_image_url ? (
        <img
          src={listing.hero_image_url}
          alt={listing.title ?? ''}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-4xl">
          🏠
        </div>
      )}
      <div className="p-4">
        <h2 className="font-semibold text-gray-900 text-base">
          {listing.ai_title || listing.title || 'נכס למכירה'}
        </h2>
        {address && <p className="text-sm text-gray-500 mt-0.5">{address}</p>}
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
          {listing.rooms && <span>{listing.rooms} חד׳</span>}
          {listing.built_area && <span>{listing.built_area} מ״ר</span>}
        </div>
        {(listing.price || listing.price_on_request) && (
          <p
            className="mt-2 font-bold text-base"
            style={{ color: accentColor ?? '#2563eb' }}
          >
            {listing.price_on_request
              ? 'מחיר לפי פנייה'
              : new Intl.NumberFormat('he-IL', {
                  style: 'currency',
                  currency: 'ILS',
                  maximumFractionDigits: 0,
                }).format(listing.price!)}
          </p>
        )}
      </div>
    </Link>
  )
}
