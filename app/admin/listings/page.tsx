import { sql } from '@/lib/db'
import type { Listing } from '@/lib/db/types'
import { ListingRowActions } from './_row-actions'

interface ListingRow extends Listing {
  agency_name: string | null
}

// A listing is considered "published" once it has the minimum content
// to be useful: a title (manual or AI) AND either a price or an image.
function isPublished(l: ListingRow): boolean {
  const hasTitle = !!(l.ai_title || l.title)
  const hasContent = !!(l.price || l.price_on_request || l.hero_image_url || (l.image_urls && l.image_urls.length > 0))
  return hasTitle && hasContent
}

async function getAllListings() {
  const { rows } = await sql<ListingRow>`
    SELECT l.*,
      a.name AS agency_name
    FROM listings l
    LEFT JOIN agencies a ON a.id = l.agency_id
    ORDER BY l.created_at DESC
    LIMIT 500
  `
  return rows
}

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: 'all' | 'published' | 'draft' }>
}) {
  const { filter = 'all' } = await searchParams
  const all = await getAllListings()
  const published = all.filter(isPublished)
  const drafts = all.filter(l => !isPublished(l))
  const listings = filter === 'published' ? published : filter === 'draft' ? drafts : all

  const filters = [
    { value: 'all',       label: 'הכל',       count: all.length },
    { value: 'published', label: 'פורסמו',   count: published.length },
    { value: 'draft',     label: 'טיוטות',   count: drafts.length },
  ] as const

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">נכסים</h1>
        <div className="flex gap-2">
          {filters.map(f => (
            <a
              key={f.value}
              href={f.value === 'all' ? '/admin/listings' : `/admin/listings?filter=${f.value}`}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {f.label} <span className="opacity-70">({f.count})</span>
            </a>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs border-b border-gray-700">
              <th className="text-right px-5 py-3 font-medium">נכס</th>
              <th className="text-right px-5 py-3 font-medium">מצב</th>
              <th className="text-right px-5 py-3 font-medium">עיר</th>
              <th className="text-right px-5 py-3 font-medium">מחיר</th>
              <th className="text-right px-5 py-3 font-medium">סוכנות / משתמש</th>
              <th className="text-right px-5 py-3 font-medium">תאריך</th>
              <th className="text-right px-5 py-3 font-medium">קישור</th>
              <th className="text-right px-5 py-3 font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {listings.map((l) => (
              <tr key={l.id} className="hover:bg-gray-750 text-gray-200">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    {l.hero_image_url ? (
                      <img src={l.hero_image_url} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-sm shrink-0">🏠</div>
                    )}
                    <span className="truncate max-w-[160px]">
                      {l.ai_title || l.title || l.street || <span className="text-gray-500">ללא שם</span>}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  {isPublished(l) ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-900 text-green-300 font-medium">פורסם</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900 text-yellow-300 font-medium">טיוטה</span>
                  )}
                </td>
                <td className="px-5 py-3 text-gray-400">{l.city ?? '—'}</td>
                <td className="px-5 py-3 text-gray-300">
                  {l.price_on_request
                    ? 'לפי פנייה'
                    : l.price
                    ? `₪${l.price.toLocaleString('he-IL')}`
                    : '—'}
                </td>
                <td className="px-5 py-3 text-gray-400 text-xs">
                  {l.agency_name
                    ? <span className="text-blue-400">{l.agency_name}</span>
                    : l.user_id
                    ? <span className="text-gray-300">פרטי</span>
                    : <span className="text-gray-600">אנונימי</span>}
                </td>
                <td className="px-5 py-3 text-gray-400 text-xs">
                  {new Date(l.created_at).toLocaleDateString('he-IL')}
                </td>
                <td className="px-5 py-3">
                  <a
                    href={l.agency_id ? `/builder?id=${l.id}` : `/p/${l.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline text-xs"
                  >
                    ↗
                  </a>
                </td>
                <td className="px-5 py-3">
                  <ListingRowActions
                    id={l.id}
                    status={l.status}
                    title={l.ai_title || l.title || l.street || 'נכס'}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
