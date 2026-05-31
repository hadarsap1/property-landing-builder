import { sql } from '@/lib/db'
import type { Listing } from '@/lib/db/types'

interface ListingRow extends Listing {
  agency_name: string | null
}

async function getAllListings() {
  const { rows } = await sql<ListingRow>`
    SELECT l.*,
      a.name AS agency_name
    FROM listings l
    LEFT JOIN agencies a ON a.id = l.agency_id
    ORDER BY l.created_at DESC
    LIMIT 200
  `
  return rows
}

const STATUS_LABELS: Record<Listing['status'], string> = {
  active: 'פעיל',
  paused: 'מושהה',
  sold: 'נמכר',
}

const STATUS_COLORS: Record<Listing['status'], string> = {
  active: 'bg-green-900 text-green-300',
  paused: 'bg-yellow-900 text-yellow-300',
  sold: 'bg-gray-700 text-gray-400',
}

export default async function AdminListingsPage() {
  const listings = await getAllListings()

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">נכסים ({listings.length}+)</h1>

      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs border-b border-gray-700">
              <th className="text-right px-5 py-3 font-medium">נכס</th>
              <th className="text-right px-5 py-3 font-medium">עיר</th>
              <th className="text-right px-5 py-3 font-medium">מחיר</th>
              <th className="text-right px-5 py-3 font-medium">סטטוס</th>
              <th className="text-right px-5 py-3 font-medium">סוכנות / משתמש</th>
              <th className="text-right px-5 py-3 font-medium">תאריך</th>
              <th className="text-right px-5 py-3 font-medium">קישור</th>
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
                <td className="px-5 py-3 text-gray-400">{l.city ?? '—'}</td>
                <td className="px-5 py-3 text-gray-300">
                  {l.price_on_request
                    ? 'לפי פנייה'
                    : l.price
                    ? `₪${l.price.toLocaleString('he-IL')}`
                    : '—'}
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[l.status]}`}>
                    {STATUS_LABELS[l.status]}
                  </span>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
