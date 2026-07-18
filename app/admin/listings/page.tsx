import { sql } from '@/lib/db'
import { getDemoAgencyId } from '@/lib/db/queries/demo'
import type { Listing } from '@/lib/db/types'
import { ListingRowActions } from './_row-actions'

interface ListingRow extends Listing {
  agency_name: string | null
  views: string
  whatsapp: string
  phone: string
  booking: string
  leads: string
}

function isPublished(l: ListingRow): boolean {
  const hasTitle = !!(l.ai_title || l.title)
  const hasContent = !!(l.price || l.price_on_request || l.hero_image_url || (l.image_urls && l.image_urls.length > 0))
  return hasTitle && hasContent
}

async function getAllListings(demoAgencyId: string | null, includeDemo: boolean) {
  const { rows } = await sql<ListingRow>`
    SELECT l.*,
      a.name AS agency_name,
      COALESCE(ev.views,    '0') AS views,
      COALESCE(ev.whatsapp, '0') AS whatsapp,
      COALESCE(ev.phone,    '0') AS phone,
      COALESCE(ev.booking,  '0') AS booking,
      COALESCE(ld.count,    '0') AS leads
    FROM listings l
    LEFT JOIN agencies a ON a.id = l.agency_id
    LEFT JOIN (
      SELECT listing_id,
        COUNT(*) FILTER (WHERE event_type = 'page_view')::text      AS views,
        COUNT(*) FILTER (WHERE event_type = 'whatsapp_click')::text AS whatsapp,
        COUNT(*) FILTER (WHERE event_type = 'phone_click')::text    AS phone,
        COUNT(*) FILTER (WHERE event_type = 'booking_click')::text  AS booking
      FROM analytics_events
      GROUP BY listing_id
    ) ev ON ev.listing_id = l.id
    LEFT JOIN (
      SELECT listing_id, COUNT(*)::text AS count
      FROM leads
      WHERE listing_id IS NOT NULL
      GROUP BY listing_id
    ) ld ON ld.listing_id = l.id
    WHERE (${includeDemo} = true OR l.agency_id IS DISTINCT FROM ${demoAgencyId})
    ORDER BY l.created_at DESC
    LIMIT 500
  `
  return rows
}

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: 'all' | 'published' | 'draft'; demo?: '1' }>
}) {
  const { filter = 'all', demo } = await searchParams
  const includeDemo = demo === '1'
  const demoAgencyId = await getDemoAgencyId()
  const all = await getAllListings(demoAgencyId, includeDemo)
  const published = all.filter(isPublished)
  const drafts = all.filter(l => !isPublished(l))
  const listings = filter === 'published' ? published : filter === 'draft' ? drafts : all

  const filters = [
    { value: 'all',       label: 'הכל',       count: all.length },
    { value: 'published', label: 'פורסמו',   count: published.length },
    { value: 'draft',     label: 'טיוטות',   count: drafts.length },
  ] as const

  const buildHref = (f: typeof filters[number]['value']) => {
    const parts: string[] = []
    if (f !== 'all') parts.push(`filter=${f}`)
    if (includeDemo) parts.push('demo=1')
    return parts.length ? `/admin/listings?${parts.join('&')}` : '/admin/listings'
  }

  const toggleDemoHref = () => {
    const parts: string[] = []
    if (filter !== 'all') parts.push(`filter=${filter}`)
    if (!includeDemo) parts.push('demo=1')
    return parts.length ? `/admin/listings?${parts.join('&')}` : '/admin/listings'
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">נכסים</h1>
        <div className="flex gap-2 items-center">
          {filters.map(f => (
            <a
              key={f.value}
              href={buildHref(f.value)}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {f.label} <span className="opacity-70">({f.count})</span>
            </a>
          ))}
          {demoAgencyId && (
            <a
              href={toggleDemoHref()}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border ${
                includeDemo
                  ? 'bg-purple-900 border-purple-700 text-purple-200'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {includeDemo ? '✓ כולל דמו' : 'כלול דמו'}
            </a>
          )}
        </div>
      </div>

      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-gray-700">
                <th className="text-right px-4 py-3 font-medium">נכס</th>
                <th className="text-right px-3 py-3 font-medium">מצב</th>
                <th className="text-right px-3 py-3 font-medium">עיר</th>
                <th className="text-right px-3 py-3 font-medium">מחיר</th>
                <th className="text-center px-3 py-3 font-medium">👁️ צפיות</th>
                <th className="text-center px-3 py-3 font-medium">💬 WA</th>
                <th className="text-center px-3 py-3 font-medium">📞 שיחות</th>
                <th className="text-center px-3 py-3 font-medium">📅 תיאום</th>
                <th className="text-center px-3 py-3 font-medium">📬 לידים</th>
                <th className="text-right px-3 py-3 font-medium">בעלים</th>
                <th className="text-right px-3 py-3 font-medium">תאריך</th>
                <th className="text-right px-3 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {listings.map((l) => {
                const isDemo = demoAgencyId && l.agency_id === demoAgencyId
                const views = parseInt(l.views, 10)
                const whatsapp = parseInt(l.whatsapp, 10)
                const phone = parseInt(l.phone, 10)
                const booking = parseInt(l.booking, 10)
                const leads = parseInt(l.leads, 10)
                return (
                  <tr key={l.id} className={`text-gray-200 ${isDemo ? 'bg-purple-950/30' : 'hover:bg-gray-750'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {l.hero_image_url ? (
                          <img src={l.hero_image_url} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-sm shrink-0">🏠</div>
                        )}
                        <span className="truncate max-w-[160px]">
                          {l.ai_title || l.title || l.street || <span className="text-gray-500">ללא שם</span>}
                        </span>
                        {isDemo && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-900 text-purple-200 font-medium shrink-0">דמו</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {isPublished(l) ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-900 text-green-300 font-medium">פורסם</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900 text-yellow-300 font-medium">טיוטה</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-400">{l.city ?? '—'}</td>
                    <td className="px-3 py-3 text-gray-300 text-xs">
                      {l.price_on_request
                        ? 'לפי פנייה'
                        : l.price
                        ? `₪${l.price.toLocaleString('he-IL')}`
                        : '—'}
                    </td>
                    <td className={`px-3 py-3 text-center font-semibold ${views > 0 ? 'text-white' : 'text-gray-600'}`}>
                      {views.toLocaleString('he-IL')}
                    </td>
                    <td className={`px-3 py-3 text-center font-semibold ${whatsapp > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                      {whatsapp.toLocaleString('he-IL')}
                    </td>
                    <td className={`px-3 py-3 text-center font-semibold ${phone > 0 ? 'text-blue-400' : 'text-gray-600'}`}>
                      {phone.toLocaleString('he-IL')}
                    </td>
                    <td className={`px-3 py-3 text-center font-semibold ${booking > 0 ? 'text-purple-400' : 'text-gray-600'}`}>
                      {booking.toLocaleString('he-IL')}
                    </td>
                    <td className={`px-3 py-3 text-center font-semibold ${leads > 0 ? 'text-orange-400' : 'text-gray-600'}`}>
                      {leads.toLocaleString('he-IL')}
                    </td>
                    <td className="px-3 py-3 text-gray-400 text-xs">
                      {l.agency_name
                        ? <span className="text-blue-400">{l.agency_name}</span>
                        : l.user_id
                        ? <span className="text-gray-300">פרטי</span>
                        : <span className="text-gray-600">אנונימי</span>}
                    </td>
                    <td className="px-3 py-3 text-gray-400 text-xs">
                      {new Date(l.created_at).toLocaleDateString('he-IL')}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <a
                          href={l.agency_id ? `/builder?id=${l.id}` : `/p/${l.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline text-xs"
                        >
                          ↗
                        </a>
                        <ListingRowActions
                          id={l.id}
                          status={l.status}
                          title={l.ai_title || l.title || l.street || 'נכס'}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
