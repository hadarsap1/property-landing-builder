import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getListingById } from '@/lib/db/queries/listings'
import { getAgencyById } from '@/lib/db/queries/agencies'
import FlyerActions from './_flyer-actions'

export const dynamic = 'force-dynamic'

// Standalone (no dashboard chrome) so the printed page is just the flyer
export const metadata = { robots: { index: false, follow: false } }

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? 'property-landing-builder.vercel.app'

const AIR_LABEL: Record<string, string> = { N: 'צפון', S: 'דרום', E: 'מזרח', W: 'מערב' }

type Props = { params: Promise<{ id: string }> }

export default async function FlyerPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect(`/auth/login?callbackUrl=/flyer/${id}`)

  const listing = await getListingById(id)
  if (!listing) notFound()

  // Only the owning agency or personal owner may print a flyer
  const user = session.user as { agencyId?: string; personalUserId?: string }
  const owns =
    (user.agencyId && listing.agency_id === user.agencyId) ||
    (user.personalUserId && listing.user_id === user.personalUserId)
  if (!owns) notFound()

  const agency = listing.agency_id ? await getAgencyById(listing.agency_id) : null

  const title = listing.ai_title || listing.title || 'נכס למכירה'
  const address = [listing.street, listing.neighborhood, listing.city].filter(Boolean).join(', ')
  const price = listing.price_on_request
    ? 'מחיר לפי פנייה'
    : listing.price
      ? `₪${listing.price.toLocaleString('he-IL')}`
      : ''
  const accent = listing.accent_color || agency?.primary_color || '#2563eb'

  const publicUrl = agency
    ? `https://${agency.slug}.${ROOT_DOMAIN}/listings/${listing.slug}`
    : `https://${ROOT_DOMAIN}/p/${listing.id}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(publicUrl)}`

  const specs: { label: string; value: string }[] = []
  if (listing.rooms) specs.push({ label: 'חדרים', value: `${listing.rooms}` })
  if (listing.built_area) specs.push({ label: 'שטח בנוי', value: `${listing.built_area} מ״ר` })
  if (listing.outdoor_area) specs.push({ label: 'גינה/מרפסת', value: `${listing.outdoor_area} מ״ר` })
  if (listing.floor != null) {
    specs.push({ label: 'קומה', value: listing.total_floors ? `${listing.floor}/${listing.total_floors}` : `${listing.floor}` })
  }
  if (listing.bathrooms) specs.push({ label: 'שירותים', value: `${listing.bathrooms}` })
  if (listing.parking_spots) specs.push({ label: 'חניה', value: `${listing.parking_spots}` })
  if (listing.has_elevator) specs.push({ label: 'מעלית', value: '✓' })
  if (listing.has_saferoom) specs.push({ label: 'ממ״ד', value: '✓' })
  if (listing.has_storage) specs.push({ label: 'מחסן', value: '✓' })
  if (listing.build_year) specs.push({ label: 'שנת בנייה', value: `${listing.build_year}` })
  if (listing.air_directions?.length) {
    specs.push({ label: 'כיוונים', value: listing.air_directions.map((d) => AIR_LABEL[d] ?? d).join(', ') })
  }

  const openHouse =
    listing.open_house_date && new Date(listing.open_house_date).getTime() > Date.now()
      ? `${new Date(listing.open_house_date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })} בשעה ${new Date(listing.open_house_date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`
      : null

  return (
    <main dir="rtl" className="min-h-screen bg-gray-100 print:bg-white py-6 print:py-0">
      <FlyerActions />

      {/* A4 sheet */}
      <div className="mx-auto bg-white shadow-lg print:shadow-none w-[210mm] max-w-full print:w-full overflow-hidden">
        {/* Header band */}
        <div className="flex items-center justify-between px-8 py-4 text-white" style={{ background: accent }}>
          <div className="text-lg font-bold">
            {agency?.name ?? listing.seller_name ?? 'למכירה'}
          </div>
          <div className="text-sm font-semibold">
            {listing.listing_type === 'rent' ? 'להשכרה' : 'למכירה'}
          </div>
        </div>

        {/* Hero */}
        {listing.hero_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.hero_image_url}
            alt={title}
            className="w-full h-[90mm] object-cover"
          />
        )}

        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {address && <p className="text-gray-500 mt-1">{address}</p>}
          {listing.ai_tagline && (
            <p className="text-lg italic mt-2" style={{ color: accent }}>{listing.ai_tagline}</p>
          )}

          {price && (
            <p className="text-4xl font-bold mt-4" style={{ color: accent }}>{price}</p>
          )}

          {openHouse && (
            <div className="mt-4 border-2 rounded-xl px-4 py-3 inline-block font-semibold" style={{ borderColor: accent, color: accent }}>
              🏠 בית פתוח: {openHouse}
            </div>
          )}

          {/* Specs */}
          {specs.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mt-6">
              {specs.slice(0, 8).map((s) => (
                <div key={s.label} className="border border-gray-200 rounded-lg p-2.5 text-center">
                  <div className="text-xs text-gray-500">{s.label}</div>
                  <div className="font-bold text-gray-900">{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Highlights */}
          {(listing.ai_highlights?.length ?? 0) > 0 && (
            <ul className="mt-6 space-y-1.5">
              {listing.ai_highlights!.slice(0, 4).map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-800">
                  <span className="font-bold" style={{ color: accent }}>✓</span>
                  {h}
                </li>
              ))}
            </ul>
          )}

          {/* Contact + QR */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <div>
              {listing.seller_name && (
                <p className="font-semibold text-gray-900">{listing.seller_name}</p>
              )}
              {listing.seller_phone && (
                <p className="text-2xl font-bold mt-1" dir="ltr" style={{ color: accent }}>
                  {listing.seller_phone}
                </p>
              )}
              {agency?.contact_phone && agency.contact_phone !== listing.seller_phone && (
                <p className="text-gray-600 mt-1" dir="ltr">{agency.contact_phone}</p>
              )}
              <p className="text-xs text-gray-400 mt-3">סרקו את הקוד לצפייה בכל התמונות והפרטים</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR לדף הנכס" className="w-[34mm] h-[34mm]" />
          </div>
        </div>
      </div>
    </main>
  )
}
