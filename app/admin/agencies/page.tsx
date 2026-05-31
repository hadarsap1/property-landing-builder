import { sql } from '@/lib/db'
import Link from 'next/link'
import type { Agency } from '@/lib/db/types'

interface AgencyWithCount extends Agency {
  listing_count: string
  agent_count: string
}

async function getAgencies() {
  const { rows } = await sql<AgencyWithCount>`
    SELECT a.*,
      (SELECT COUNT(*) FROM listings l WHERE l.agency_id = a.id)::text AS listing_count,
      (SELECT COUNT(*) FROM agents ag WHERE ag.agency_id = a.id)::text AS agent_count
    FROM agencies a
    ORDER BY a.created_at DESC
  `
  return rows
}

export default async function AdminAgenciesPage() {
  const agencies = await getAgencies()

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">סוכנויות ({agencies.length})</h1>

      {agencies.length === 0 ? (
        <p className="text-gray-400">אין סוכנויות עדיין</p>
      ) : (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-gray-700">
                <th className="text-right px-5 py-3 font-medium">שם</th>
                <th className="text-right px-5 py-3 font-medium">Slug</th>
                <th className="text-right px-5 py-3 font-medium">נכסים</th>
                <th className="text-right px-5 py-3 font-medium">סוכנים</th>
                <th className="text-right px-5 py-3 font-medium">נוצר</th>
                <th className="text-right px-5 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {agencies.map((a) => (
                <tr key={a.id} className="hover:bg-gray-750 text-gray-200">
                  <td className="px-5 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      {a.logo_url && (
                        <img src={a.logo_url} alt="" className="w-6 h-6 rounded object-contain bg-white" />
                      )}
                      {a.name}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-400 font-mono text-xs">{a.slug}</td>
                  <td className="px-5 py-3 text-center">{a.listing_count}</td>
                  <td className="px-5 py-3 text-center">{a.agent_count}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {new Date(a.created_at).toLocaleDateString('he-IL')}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <a
                        href={`/agency/${a.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline text-xs"
                      >
                        צפה ↗
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
