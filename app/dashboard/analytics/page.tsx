'use client'

import { useState, useEffect } from 'react'
import type { AgencyStats, DayBucket, ListingStatRow, FunnelStats } from '@/lib/db/queries/analytics'

type AnalyticsResponse = {
  stats: AgencyStats
  timeSeries: DayBucket[]
  listingStats: (ListingStatRow & { title: string; slug: string; leads: number })[]
  funnel: FunnelStats
  days: number
}

const DAY_OPTIONS = [7, 14, 30, 60, 90]

export default function AnalyticsPage() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    void fetch(`/api/analytics?days=${days}`)
      .then(r => r.json())
      .then((d: AnalyticsResponse) => { setData(d); setLoading(false) })
  }, [days])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold" style={{ color: '#111' }}>אנליטיקס</h1>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f3f4f6' }}>
          {DAY_OPTIONS.map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
              style={days === d
                ? { background: '#fff', color: '#111', border: '1px solid #e5e5e5' }
                : { color: '#888' }}
            >
              {d}י׳
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <AnalyticsSkeleton />
      ) : (
        <>
          <StatCards stats={data.stats} />
          <Funnel funnel={data.funnel} />
          <TimeSeriesChart series={data.timeSeries} />
          <ListingsTable rows={data.listingStats} />
        </>
      )}
    </div>
  )
}

/* ── Loading skeleton ───────────────────────────────────────────────── */
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 space-y-3" style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px' }}>
            <div className="w-6 h-6 rounded" style={{ background: '#e5e5e5' }} />
            <div className="w-16 h-7 rounded" style={{ background: '#e5e5e5' }} />
            <div className="w-12 h-3 rounded" style={{ background: '#f3f4f6' }} />
          </div>
        ))}
      </div>
      <div className="p-5 h-52" style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px' }} />
      <div className="overflow-hidden" style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px' }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="px-5 py-4 flex justify-between" style={{ borderBottom: '1px solid #e5e5e5' }}>
            <div className="w-40 h-4 rounded" style={{ background: '#e5e5e5' }} />
            <div className="w-20 h-4 rounded" style={{ background: '#f3f4f6' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Stat cards ─────────────────────────────────────────────────────── */
function StatCards({ stats }: { stats: AgencyStats }) {
  const cards = [
    { label: 'צפיות',          value: stats.total_views,     icon: '👁' },
    { label: 'מבקרים ייחודיים', value: stats.unique_sessions, icon: '👤' },
    { label: 'וואטסאפ',        value: stats.whatsapp_clicks, icon: '💬' },
    { label: 'שיחות טלפון',    value: stats.phone_clicks,    icon: '📞' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map(c => (
        <div key={c.label} className="p-4 space-y-1" style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px' }}>
          <div className="text-xl">{c.icon}</div>
          <div className="text-2xl font-bold" style={{ color: '#111' }}>{c.value.toLocaleString('he-IL')}</div>
          <div className="text-xs" style={{ color: '#888' }}>{c.label}</div>
        </div>
      ))}
    </div>
  )
}

/* ── Conversion funnel ──────────────────────────────────────────────── */
function Funnel({ funnel }: { funnel: FunnelStats }) {
  const stages = [
    { label: 'צפיות בדפים',   value: funnel.views,           color: '#c0392b' },
    { label: 'מבקרים ייחודיים', value: funnel.unique_sessions, color: '#e74c3c' },
    { label: 'יצירות קשר',    value: funnel.contact_clicks,   color: '#111' },
    { label: 'לידים',          value: funnel.leads,            color: '#166534' },
  ]
  const max = Math.max(stages[0].value, 1)

  if (funnel.views === 0 && funnel.leads === 0) return null

  function pct(from: number, to: number): string {
    if (!from) return '—'
    return `${Math.round((to / from) * 100)}%`
  }

  return (
    <div className="p-5 space-y-3" style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px' }}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: '#111' }}>משפך המרה</h2>
        {funnel.open_house_regs > 0 && (
          <span className="text-xs font-medium" style={{ color: '#c0392b' }}>
            🗓️ {funnel.open_house_regs} נרשמו לבתים פתוחים
          </span>
        )}
      </div>
      <div className="space-y-2">
        {stages.map((s, i) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className="w-28 shrink-0 text-xs" style={{ color: '#888' }}>{s.label}</div>
            <div className="flex-1 h-7 rounded-lg overflow-hidden" style={{ background: '#f7f5f2' }}>
              <div
                className="h-full rounded-lg flex items-center px-2 transition-all"
                style={{
                  width: `${Math.max((s.value / max) * 100, s.value > 0 ? 6 : 0)}%`,
                  background: s.color,
                }}
              >
                <span className="text-xs font-bold text-white">{s.value.toLocaleString('he-IL')}</span>
              </div>
            </div>
            <div className="w-12 shrink-0 text-xs text-left" style={{ color: '#aaa' }} title={i === 0 ? '' : `המרה מ${stages[i - 1].label}`}>
              {i === 0 ? '' : pct(stages[i - 1].value, s.value)}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs" style={{ color: '#aaa' }}>
        {funnel.views > 0 && funnel.leads > 0
          ? `סה״כ: ${pct(funnel.views, funnel.leads)} מהצפיות הפכו ללידים`
          : 'אחוזי ההמרה מחושבים בין שלב לשלב'}
      </p>
    </div>
  )
}

/* ── Time series bar chart ──────────────────────────────────────────── */
function TimeSeriesChart({ series }: { series: DayBucket[] }) {
  const maxViews = Math.max(...series.map(d => d.views), 1)

  // Show at most 30 bars regardless of range (group if needed)
  const bars = series.slice(-30)

  const totalViews = series.reduce((s, d) => s + d.views, 0)
  if (totalViews === 0) {
    return (
      <div className="p-6 text-center text-sm" style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px', color: '#aaa' }}>
        אין נתוני צפיות עדיין
      </div>
    )
  }

  return (
    <div className="p-5 space-y-3" style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px' }}>
      <h2 className="text-sm font-semibold" style={{ color: '#111' }}>צפיות לאורך זמן</h2>
      <div className="flex items-end gap-0.5 h-32" dir="ltr">
        {bars.map(d => {
          const heightPct = Math.round((d.views / maxViews) * 100)
          return (
            <div key={d.date} className="group flex-1 flex flex-col items-center gap-0.5 relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 hidden group-hover:block text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10" style={{ background: '#111' }}>
                {d.date}: {d.views} צפיות, {d.clicks} לחיצות
              </div>
              {/* Views bar */}
              <div
                className="w-full rounded-t transition-all"
                style={{ height: `${Math.max(heightPct, d.views > 0 ? 4 : 0)}%`, background: '#c0392b' }}
              />
              {/* Clicks overlay (stacked look) */}
              {d.clicks > 0 && (
                <div
                  className="absolute bottom-0 w-full rounded-t opacity-70"
                  style={{ height: `${Math.round((d.clicks / maxViews) * 100)}%`, background: '#166534' }}
                />
              )}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-4 text-xs" style={{ color: '#888' }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#c0392b' }} />
          צפיות
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#166534' }} />
          לחיצות
        </span>
      </div>
    </div>
  )
}

/* ── Per-listing table ──────────────────────────────────────────────── */
function ListingsTable({
  rows,
}: {
  rows: (ListingStatRow & { title: string; slug: string; leads: number })[]
}) {
  if (!rows.length) return null

  const maxViews = Math.max(...rows.map(r => r.views), 1)

  return (
    <div className="overflow-hidden" style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #e5e5e5' }}>
        <h2 className="text-sm font-semibold" style={{ color: '#111' }}>ביצועים לפי נכס</h2>
      </div>
      <div>
        {rows.map(r => (
          <div key={r.listing_id} className="px-5 py-3 space-y-1.5" style={{ borderBottom: '1px solid #e5e5e5' }}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium truncate" style={{ color: '#111' }}>{r.title}</span>
              <div className="flex items-center gap-4 shrink-0 text-xs" style={{ color: '#888' }}>
                <span title="צפיות">👁 {r.views}</span>
                <span title="מבקרים ייחודיים">👤 {r.unique_sessions}</span>
                <span title="לחיצות">📲 {r.clicks}</span>
                <span title="לידים" style={r.leads > 0 ? { color: '#166534', fontWeight: 600 } : {}}>🎯 {r.leads}</span>
              </div>
            </div>
            {/* Mini bar */}
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f7f5f2' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.round((r.views / maxViews) * 100)}%`, background: '#c0392b' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
