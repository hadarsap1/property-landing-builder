import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getAgencyBySlug } from '@/lib/db/queries/agencies'
import { getListingsByAgency } from '@/lib/db/queries/listings'
import { isAgencyActive } from '@/lib/billing/access'
import type { Listing } from '@/lib/db/types'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? 'property-landing-builder.vercel.app'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const agency = await getAgencyBySlug(slug)
  if (!agency) return { title: 'סוכנות לא נמצאה' }
  const canonical = `https://${slug}.${ROOT_DOMAIN}/`
  const title = `${agency.name} — נכסים למכירה ולהשכרה`
  const description = `כל הנכסים של ${agency.name}: דירות ובתים למכירה ולהשכרה`
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      siteName: agency.name,
      locale: 'he_IL',
      ...(agency.logo_url ? { images: [agency.logo_url] } : {}),
    },
  }
}

export default async function AgencyPage({ params }: Props) {
  const { slug } = await params
  const agency = await getAgencyBySlug(slug)
  if (!agency) notFound()

  const active_subscription = await isAgencyActive(agency.id)
  if (!active_subscription) notFound()

  const listings = await getListingsByAgency(agency.id, { limit: 200 })
  const active = listings.filter((l) => l.status === 'active')
  const accent = agency.primary_color ?? '#1e3a5f'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: agency.name,
    url: `https://${slug}.${ROOT_DOMAIN}/`,
    ...(agency.logo_url ? { logo: agency.logo_url } : {}),
    ...(agency.contact_phone ? { telephone: agency.contact_phone } : {}),
    ...(agency.contact_email ? { email: agency.contact_email } : {}),
  }

  return (
    <main className="min-h-screen bg-gray-50" dir="rtl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <header className="text-white py-10 px-4 text-center" style={{ background: accent }}>
        {agency.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={agency.logo_url} alt={agency.name} className="h-12 mx-auto mb-4 object-contain" />
        )}
        <h1 className="text-2xl font-bold">{agency.name}</h1>
        <p className="text-sm opacity-80 mt-1">{active.length} נכסים פעילים</p>
        {(agency.contact_phone || agency.contact_email) && (
          <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
            {agency.contact_phone && (
              <a
                href={`tel:${agency.contact_phone.replace(/\D/g, '')}`}
                className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors"
              >
                📞 {agency.contact_phone}
              </a>
            )}
            {agency.contact_phone && (
              <a
                href={`https://wa.me/972${agency.contact_phone.replace(/\D/g, '').replace(/^0/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors"
              >
                💬 WhatsApp
              </a>
            )}
            {agency.contact_email && (
              <a
                href={`mailto:${agency.contact_email}`}
                className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors"
              >
                ✉️ מייל
              </a>
            )}
          </div>
        )}
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

      <footer className="text-center text-sm text-gray-400 py-8 border-t border-gray-200">
        {agency.name}
        {agency.contact_phone ? ` · ${agency.contact_phone}` : ''}
        {agency.contact_email ? ` · ${agency.contact_email}` : ''}
      </footer>
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
  const hasOpenHouse =
    listing.open_house_date && new Date(listing.open_house_date).getTime() > Date.now()

  return (
    <Link
      href={`/agency/${agencySlug}/listings/${listing.slug}`}
      className="block bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative">
        {listing.hero_image_url ? (
          <Image
            src={listing.hero_image_url}
            alt={listing.title ?? ''}
            width={640}
            height={360}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-4xl">
            🏠
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-2">
          <span className="bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {listing.listing_type === 'rent' ? 'להשכרה' : 'למכירה'}
          </span>
          {hasOpenHouse && (
            <span className="bg-amber-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              🗓️ בית פתוח
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <h2 className="font-semibold text-gray-900 text-base">
          {listing.ai_title || listing.title || 'נכס למכירה'}
        </h2>
        {address && <p className="text-sm text-gray-500 mt-0.5">{address}</p>}
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
          {listing.rooms && <span>{listing.rooms} חד׳</span>}
          {listing.built_area && <span>{listing.built_area} מ״ר</span>}
          {listing.floor != null && <span>קומה {listing.floor}</span>}
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
