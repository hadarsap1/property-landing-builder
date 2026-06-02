import { sql } from '@/lib/db'
import Link from 'next/link'
import type { Agency } from '@/lib/db/types'
import CreateAgencyForm from './_create-form'
import DeleteAgencyButton from './_delete-button'

interface AgencyRow extends Agency {
  listing_count: string
  agent_count: string
  sub_plan: string | null
  sub_status: string | null
}

async function getAgencies() {
  const { rows } = await sql<AgencyRow>`
    SELECT a.*,
      (SELECT COUNT(*) FROM listings l WHERE l.agency_id = a.id)::text AS listing_count,
      (SELECT COUNT(*) FROM agents ag WHERE ag.agency_id = a.id)::text AS agent_count,
      s.plan AS sub_plan,
      s.status AS sub_status
    FROM agencies a
    LEFT JOIN subscriptions s ON s.agency_id = a.id
    ORDER BY a.created_at DESC
  `
  return rows
}

const PLAN_LABELS: Record<string, string> = { monthly: 'חודשי', yearly: 'שנתי' }

const STATUS_COLORS: Record<string, string> = {
  trialing: 'bg-blue-900 text-blue-300',
  active: 'bg-green-900 text-green-300',
  past_due: 'bg-yellow-900 text-yellow-300',
  canceled: 'bg-gray-700 text-gray-400',
  unpaid: 'bg-red-900 text-red-300',
}

const STATUS_LABELS: Record<string, string> = {
  trialing: 'ניסיון',
  active: 'פעיל',
  past_due: 'פיגור',
  canceled: 'בוטל',
  unpaid: 'לא שולם',
}

export default async function AdminAgenciesPage() {
  const agencies = await getAgencies()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">סוכנויות ({agencies.length})</h1>
        <CreateAgencyForm />
      </div>

      {agencies.length === 0 ? (
        <p className="text-gray-400">אין סוכנויות עדיין</p>
      ) : (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-gray-700">
                <th className="text-right px-5 py-3 font-medium">שם</th>
                <th className="text-right px-5 py-3 font-medium">Slug</th>
                <th className="text-center px-5 py-3 font-medium">נכסים</th>
                <th className="text-center px-5 py-3 font-medium">סוכנים</th>
                <th className="text-center px-5 py-3 font-medium">מנוי</th>
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
                  <td className="px-5 py-3 text-center font-semibold">{a.listing_count}</td>
                  <td className="px-5 py-3 text-center font-semibold">{a.agent_count}</td>
                  <td className="px-5 py-3 text-center">
                    {a.sub_status ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[a.sub_status] ?? 'bg-gray-700 text-gray-400'}`}>
                          {STATUS_LABELS[a.sub_status] ?? a.sub_status}
                        </span>
                        {a.sub_plan && (
                          <span className="text-xs text-gray-500">{PLAN_LABELS[a.sub_plan] ?? a.sub_plan}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-600">—</span>
                    )}
                  </td>
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
                      <Link href={`/admin/agencies/${a.id}`} className="text-gray-400 hover:text-gray-200 text-xs">
                        נהל
                      </Link>
                      <DeleteAgencyButton id={a.id} name={a.name} />
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
