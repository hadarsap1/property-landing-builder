import { sql } from '@/lib/db'
import { getAllPersonalUsers } from '@/lib/db/queries/personal-users'
import Link from 'next/link'

interface AgencyRow { id: string; name: string; slug: string; created_at: Date }
interface ListingRow { id: string; title: string | null; city: string | null; status: string; agency_id: string | null; user_id: string | null; created_at: Date }
interface CountRow { count: string }

async function getStats() {
  const [agencies, personalUsers, listingsRes, eventsRes] = await Promise.all([
    sql<AgencyRow>`SELECT id, name, slug, created_at FROM agencies ORDER BY created_at DESC LIMIT 10`,
    getAllPersonalUsers(),
    sql<CountRow>`SELECT COUNT(*)::text AS count FROM listings`,
    sql<CountRow>`SELECT COUNT(*)::text AS count FROM analytics_events WHERE event_type = 'page_view'`,
  ])
  return {
    agencies: agencies.rows,
    personalUsers,
    listingCount: parseInt(listingsRes.rows[0]?.count ?? '0', 10),
    pageViews: parseInt(eventsRes.rows[0]?.count ?? '0', 10),
  }
}

async function getRecentListings() {
  const { rows } = await sql<ListingRow>`
    SELECT id, title, city, status, agency_id, user_id, created_at
    FROM listings ORDER BY created_at DESC LIMIT 20
  `
  return rows
}

export default async function AdminOverview() {
  const [stats, recentListings] = await Promise.all([getStats(), getRecentListings()])

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">סקירה כללית</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'סוכנויות', value: stats.agencies.length },
          { label: 'משתמשים פרטיים', value: stats.personalUsers.length },
          { label: 'נכסים', value: stats.listingCount },
          { label: 'צפיות (סה"כ)', value: stats.pageViews.toLocaleString('he-IL') },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <div className="text-2xl font-bold text-white">{kpi.value}</div>
            <div className="text-sm text-gray-400 mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Agencies */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">סוכנויות אחרונות</h2>
            <Link href="/admin/agencies" className="text-xs text-blue-400 hover:underline">הכל</Link>
          </div>
          {stats.agencies.length === 0 ? (
            <p className="text-sm text-gray-500">אין סוכנויות עדיין</p>
          ) : (
            <div className="space-y-2">
              {stats.agencies.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-200 font-medium">{a.name}</span>
                  <a
                    href={`/agency/${a.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-blue-400 text-xs"
                  >
                    /{a.slug} ↗
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Personal users */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">משתמשים פרטיים אחרונים</h2>
            <Link href="/admin/personal-users" className="text-xs text-blue-400 hover:underline">הכל</Link>
          </div>
          {stats.personalUsers.length === 0 ? (
            <p className="text-sm text-gray-500">אין משתמשים פרטיים עדיין</p>
          ) : (
            <div className="space-y-2">
              {stats.personalUsers.slice(0, 10).map((u) => (
                <div key={u.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-200">{u.email ?? u.name ?? u.id.slice(0, 8)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.plan === 'commercial' ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-400'}`}>
                    {u.plan === 'commercial' ? 'מסחרי' : 'חינמי'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent listings */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">נכסים אחרונים</h2>
            <Link href="/admin/listings" className="text-xs text-blue-400 hover:underline">הכל</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs border-b border-gray-700">
                  <th className="text-right pb-2 font-medium">כותרת</th>
                  <th className="text-right pb-2 font-medium">עיר</th>
                  <th className="text-right pb-2 font-medium">סטטוס</th>
                  <th className="text-right pb-2 font-medium">סוג</th>
                  <th className="text-right pb-2 font-medium">קישור</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {recentListings.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-750">
                    <td className="py-2 text-gray-200">{l.title ?? '—'}</td>
                    <td className="py-2 text-gray-400">{l.city ?? '—'}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        l.status === 'active' ? 'bg-green-900 text-green-300' :
                        l.status === 'paused' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {l.status === 'active' ? 'פעיל' : l.status === 'paused' ? 'מושהה' : 'נמכר'}
                      </span>
                    </td>
                    <td className="py-2 text-gray-400 text-xs">
                      {l.agency_id ? 'מסחרי' : l.user_id ? 'פרטי' : 'אנונימי'}
                    </td>
                    <td className="py-2">
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
      </div>
    </div>
  )
}
