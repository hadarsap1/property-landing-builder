import Link from 'next/link'
import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { getAgentsByAgency } from '@/lib/db/queries/agents'
import { getListingsByAgency } from '@/lib/db/queries/listings'
import type { Agency, Subscription } from '@/lib/db/types'

interface ListingStatsRow {
  listing_id: string
  views: string
  whatsapp: string
  phone: string
  booking: string
  leads: string
}

async function getListingStats(agencyId: string): Promise<Map<string, { views: number; whatsapp: number; phone: number; booking: number; leads: number }>> {
  const { rows } = await sql<ListingStatsRow>`
    SELECT l.id AS listing_id,
      COALESCE(ev.views,    '0') AS views,
      COALESCE(ev.whatsapp, '0') AS whatsapp,
      COALESCE(ev.phone,    '0') AS phone,
      COALESCE(ev.booking,  '0') AS booking,
      COALESCE(ld.count,    '0') AS leads
    FROM listings l
    LEFT JOIN (
      SELECT listing_id,
        COUNT(*) FILTER (WHERE event_type = 'page_view')::text      AS views,
        COUNT(*) FILTER (WHERE event_type = 'whatsapp_click')::text AS whatsapp,
        COUNT(*) FILTER (WHERE event_type = 'phone_click')::text    AS phone,
        COUNT(*) FILTER (WHERE event_type = 'booking_click')::text  AS booking
      FROM analytics_events
      WHERE agency_id = ${agencyId}
      GROUP BY listing_id
    ) ev ON ev.listing_id = l.id
    LEFT JOIN (
      SELECT listing_id, COUNT(*)::text AS count
      FROM leads
      WHERE agency_id = ${agencyId} AND listing_id IS NOT NULL
      GROUP BY listing_id
    ) ld ON ld.listing_id = l.id
    WHERE l.agency_id = ${agencyId}
  `
  const map = new Map<string, { views: number; whatsapp: number; phone: number; booking: number; leads: number }>()
  for (const r of rows) {
    map.set(r.listing_id, {
      views: parseInt(r.views, 10),
      whatsapp: parseInt(r.whatsapp, 10),
      phone: parseInt(r.phone, 10),
      booking: parseInt(r.booking, 10),
      leads: parseInt(r.leads, 10),
    })
  }
  return map
}

interface PageProps {
  params: Promise<{ id: string }>
}

async function getAgency(id: string): Promise<Agency | null> {
  const { rows } = await sql<Agency>`SELECT * FROM agencies WHERE id = ${id} LIMIT 1`
  return rows[0] ?? null
}

async function getSubscription(agencyId: string): Promise<Subscription | null> {
  const { rows } = await sql<Subscription>`
    SELECT * FROM subscriptions WHERE agency_id = ${agencyId} LIMIT 1
  `
  return rows[0] ?? null
}

interface TrafficRow { total_views: string; whatsapp: string; phone: string; booking: string }

async function getTraffic(agencyId: string) {
  const { rows } = await sql<TrafficRow>`
    SELECT
      COUNT(*) FILTER (WHERE event_type = 'page_view')::text      AS total_views,
      COUNT(*) FILTER (WHERE event_type = 'whatsapp_click')::text AS whatsapp,
      COUNT(*) FILTER (WHERE event_type = 'phone_click')::text    AS phone,
      COUNT(*) FILTER (WHERE event_type = 'booking_click')::text  AS booking
    FROM analytics_events
    WHERE agency_id = ${agencyId}
      AND created_at >= now() - INTERVAL '30 days'
  `
  const r = rows[0]
  return {
    views:    parseInt(r?.total_views ?? '0', 10),
    whatsapp: parseInt(r?.whatsapp    ?? '0', 10),
    phone:    parseInt(r?.phone       ?? '0', 10),
    booking:  parseInt(r?.booking     ?? '0', 10),
  }
}

interface CountsRow { leads: string; visits: string }

async function getCounts(agencyId: string) {
  const { rows } = await sql<CountsRow>`
    SELECT
      (SELECT COUNT(*) FROM leads WHERE agency_id = ${agencyId})::text          AS leads,
      (SELECT COUNT(*) FROM property_visits WHERE agency_id = ${agencyId})::text AS visits
  `
  const r = rows[0]
  return {
    leads:  parseInt(r?.leads  ?? '0', 10),
    visits: parseInt(r?.visits ?? '0', 10),
  }
}

const STATUS_LABELS: Record<string, string> = {
  trialing: 'ניסיון',
  active: 'פעיל',
  past_due: 'פיגור',
  canceled: 'בוטל',
  unpaid: 'לא שולם',
}

const STATUS_COLORS: Record<string, string> = {
  trialing: 'bg-blue-900 text-blue-300',
  active: 'bg-green-900 text-green-300',
  past_due: 'bg-yellow-900 text-yellow-300',
  canceled: 'bg-gray-700 text-gray-400',
  unpaid: 'bg-red-900 text-red-300',
}

export default async function AdminAgencyDetailPage({ params }: PageProps) {
  const { id } = await params
  const agency = await getAgency(id)
  if (!agency) notFound()

  const [agents, listings, subscription, traffic, counts, listingStats] = await Promise.all([
    getAgentsByAgency(agency.id),
    getListingsByAgency(agency.id),
    getSubscription(agency.id),
    getTraffic(agency.id),
    getCounts(agency.id),
    getListingStats(agency.id),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {agency.logo_url ? (
            <img src={agency.logo_url} alt="" className="w-12 h-12 rounded-xl object-contain bg-white p-1" />
          ) : (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white"
              style={{ background: agency.primary_color ?? '#2563eb' }}
            >
              {agency.name.charAt(0)}
            </div>
          )}
          <div>
            <Link href="/admin/agencies" className="text-xs text-gray-400 hover:text-gray-200">
              ← חזרה לרשימה
            </Link>
            <h1 className="text-2xl font-bold text-white">{agency.name}</h1>
            <p className="text-xs text-gray-400 font-mono">/{agency.slug}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={`/agency/${agency.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            עמוד הסוכנות ↗
          </a>
          <Link
            href="/admin/billing"
            className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            ניהול מנוי
          </Link>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'נכסים',  value: listings.length },
          { label: 'סוכנים', value: agents.length },
          { label: 'לידים',  value: counts.leads },
          { label: 'ביקורים', value: counts.visits },
        ].map(kpi => (
          <div key={kpi.label} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
            <div className="text-2xl font-bold text-white">{kpi.value}</div>
            <div className="text-xs text-gray-400 mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Per-listing analytics */}
      {listings.length > 0 && (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-white">נכסים — ביצועים</h2>
            <span className="text-xs text-gray-500">{listings.length} נכסים</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs border-b border-gray-700">
                  <th className="text-right px-4 py-2.5 font-medium">נכס</th>
                  <th className="text-right px-3 py-2.5 font-medium">עיר</th>
                  <th className="text-center px-3 py-2.5 font-medium">👁️ צפיות</th>
                  <th className="text-center px-3 py-2.5 font-medium">💬 WA</th>
                  <th className="text-center px-3 py-2.5 font-medium">📞 שיחות</th>
                  <th className="text-center px-3 py-2.5 font-medium">📅 תיאום</th>
                  <th className="text-center px-3 py-2.5 font-medium">📬 לידים</th>
                  <th className="text-right px-3 py-2.5 font-medium">קישור</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {listings.map(l => {
                  const s = listingStats.get(l.id) ?? { views: 0, whatsapp: 0, phone: 0, booking: 0, leads: 0 }
                  return (
                    <tr key={l.id} className="hover:bg-gray-750 text-gray-200">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {l.hero_image_url ? (
                            <img src={l.hero_image_url} alt="" className="w-7 h-7 rounded object-cover shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded bg-gray-700 flex items-center justify-center text-xs shrink-0">🏠</div>
                          )}
                          <span className="truncate max-w-[200px]">{l.ai_title || l.title || l.street || 'ללא שם'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-gray-400 text-xs">{l.city ?? '—'}</td>
                      <td className={`px-3 py-2.5 text-center font-semibold ${s.views > 0 ? 'text-white' : 'text-gray-600'}`}>
                        {s.views.toLocaleString('he-IL')}
                      </td>
                      <td className={`px-3 py-2.5 text-center font-semibold ${s.whatsapp > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                        {s.whatsapp.toLocaleString('he-IL')}
                      </td>
                      <td className={`px-3 py-2.5 text-center font-semibold ${s.phone > 0 ? 'text-blue-400' : 'text-gray-600'}`}>
                        {s.phone.toLocaleString('he-IL')}
                      </td>
                      <td className={`px-3 py-2.5 text-center font-semibold ${s.booking > 0 ? 'text-purple-400' : 'text-gray-600'}`}>
                        {s.booking.toLocaleString('he-IL')}
                      </td>
                      <td className={`px-3 py-2.5 text-center font-semibold ${s.leads > 0 ? 'text-orange-400' : 'text-gray-600'}`}>
                        {s.leads.toLocaleString('he-IL')}
                      </td>
                      <td className="px-3 py-2.5">
                        <a
                          href={`/builder?id=${l.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline text-xs"
                        >
                          פתח ↗
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Subscription */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-5">
          <h2 className="font-semibold text-white mb-4">מנוי</h2>
          {subscription ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">סטטוס</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[subscription.status] ?? 'bg-gray-700 text-gray-400'}`}>
                  {STATUS_LABELS[subscription.status] ?? subscription.status}
                </span>
              </div>
              {subscription.plan && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">תוכנית</span>
                  <span className="text-gray-200">{subscription.plan === 'yearly' ? 'שנתי' : 'חודשי'}</span>
                </div>
              )}
              {subscription.manual_override && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">גישה ידנית</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-900 text-purple-300">פעיל</span>
                </div>
              )}
              {subscription.trial_ends_at && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">סיום ניסיון</span>
                  <span className="text-gray-200">{new Date(subscription.trial_ends_at).toLocaleDateString('he-IL')}</span>
                </div>
              )}
              {subscription.current_period_end && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">סוף תקופה</span>
                  <span className="text-gray-200">{new Date(subscription.current_period_end).toLocaleDateString('he-IL')}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">אין מנוי רשום</p>
          )}
        </div>

        {/* 30-day traffic */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-5">
          <h2 className="font-semibold text-white mb-4">תנועה (30 ימים)</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-900 rounded-xl p-3">
              <div className="text-xs text-gray-400">צפיות</div>
              <div className="text-xl font-bold text-white mt-1">{traffic.views.toLocaleString('he-IL')}</div>
            </div>
            <div className="bg-gray-900 rounded-xl p-3">
              <div className="text-xs text-gray-400">וואטסאפ</div>
              <div className="text-xl font-bold text-white mt-1">{traffic.whatsapp.toLocaleString('he-IL')}</div>
            </div>
            <div className="bg-gray-900 rounded-xl p-3">
              <div className="text-xs text-gray-400">שיחות</div>
              <div className="text-xl font-bold text-white mt-1">{traffic.phone.toLocaleString('he-IL')}</div>
            </div>
            <div className="bg-gray-900 rounded-xl p-3">
              <div className="text-xs text-gray-400">תיאומי ביקור</div>
              <div className="text-xl font-bold text-white mt-1">{traffic.booking.toLocaleString('he-IL')}</div>
            </div>
          </div>
        </div>

        {/* Agents */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-5">
          <h2 className="font-semibold text-white mb-4">צוות ({agents.length})</h2>
          {agents.length === 0 ? (
            <p className="text-sm text-gray-500">אין סוכנים רשומים</p>
          ) : (
            <div className="space-y-2">
              {agents.map(a => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="text-gray-200">{a.name}</div>
                    <div className="text-xs text-gray-500">{a.email}</div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.role === 'admin' ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-400'}`}>
                    {a.role === 'admin' ? 'מנהל' : 'סוכן'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
