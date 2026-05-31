'use client'

import { useState, useEffect } from 'react'
import type { AgencyStats, DayBucket, ListingStatRow } from '@/lib/db/queries/analytics'

type AnalyticsResponse = {
  stats: AgencyStats
  timeSeries: DayBucket[]
  listingStats: (ListingStatRow & { title: string; slug: string })[]
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
        <h1 className="text-xl font-bold text-gray-900">אנליטיקס</h1>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {DAY_OPTIONS.map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                days === d ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {d}י׳
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <p className="text-gray-400 text-sm">טוען...</p>
      ) : (
        <>
          <StatCards stats={data.stats} />
          <TimeSeriesChart series={data.timeSeries} />
          <ListingsTable rows={data.listingStats} />
        </>
      )}
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
        <div key={c.label} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-1">
          <div className="text-xl">{c.icon}</div>
          <div className="text-2xl font-bold text-gray-900">{c.value.toLocaleString('he-IL')}</div>
          <div className="text-xs text-gray-500">{c.label}</div>
        </div>
      ))}
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
      <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center text-sm text-gray-400">
        אין נתוני צפיות עדיין
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
      <h2 className="text-sm font-semibold text-gray-700">צפיות לאורך זמן</h2>
      <div className="flex items-end gap-0.5 h-32" dir="ltr">
        {bars.map(d => {
          const heightPct = Math.round((d.views / maxViews) * 100)
          const label = d.date.slice(5) // MM-DD
          return (
            <div key={d.date} className="group flex-1 flex flex-col items-center gap-0.5 relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                {d.date}: {d.views} צפיות, {d.clicks} לחיצות
              </div>
              {/* Views bar */}
              <div
                className="w-full bg-blue-500 rounded-t transition-all"
                style={{ height: `${Math.max(heightPct, d.views > 0 ? 4 : 0)}%` }}
              />
              {/* Clicks overlay (stacked look) */}
              {d.clicks > 0 && (
                <div
                  className="absolute bottom-0 w-full bg-green-400 rounded-t opacity-70"
                  style={{ height: `${Math.round((d.clicks / maxViews) * 100)}%` }}
                />
              )}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-blue-500" />
          צפיות
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-green-400" />
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
  rows: (ListingStatRow & { title: string; slug: string })[]
}) {
  if (!rows.length) return null

  const maxViews = Math.max(...rows.map(r => r.views), 1)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">ביצועים לפי נכס</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {rows.map(r => (
          <div key={r.listing_id} className="px-5 py-3 space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-gray-900 truncate">{r.title}</span>
              <div className="flex items-center gap-4 shrink-0 text-xs text-gray-500">
                <span title="צפיות">👁 {r.views}</span>
                <span title="מבקרים ייחודיים">👤 {r.unique_sessions}</span>
                <span title="לחיצות">📲 {r.clicks}</span>
              </div>
            </div>
            {/* Mini bar */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400 rounded-full"
                style={{ width: `${Math.round((r.views / maxViews) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
