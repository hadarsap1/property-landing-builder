'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { PropertyVisit } from '@/lib/db/types'

type VisitWithListing = PropertyVisit & {
  listing_title: string | null
  listing_address: string | null
}

const STATUS_COLORS: Record<PropertyVisit['status'], string> = {
  scheduled: 'bg-blue-100 border-blue-300 text-blue-800',
  completed: 'bg-green-100 border-green-300 text-green-800',
  cancelled: 'bg-gray-100 border-gray-300 text-gray-500',
  no_show: 'bg-red-100 border-red-300 text-red-700',
}

const STATUS_LABELS: Record<PropertyVisit['status'], string> = {
  scheduled: 'מתוכנן',
  completed: 'הושלם',
  cancelled: 'בוטל',
  no_show: 'לא הגיע',
}

const DAYS_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
const MONTHS_HE = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

function startOfWeek(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  date.setDate(date.getDate() - day)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d)
  date.setDate(date.getDate() + n)
  return date
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function detectConflicts(visits: VisitWithListing[]): Set<string> {
  const conflicted = new Set<string>()
  const scheduled = visits.filter(v => v.status === 'scheduled')
  for (let i = 0; i < scheduled.length; i++) {
    for (let j = i + 1; j < scheduled.length; j++) {
      const a = scheduled[i]
      const b = scheduled[j]
      const aStart = new Date(a.visit_at).getTime()
      const aEnd = aStart + a.duration_minutes * 60_000
      const bStart = new Date(b.visit_at).getTime()
      const bEnd = bStart + b.duration_minutes * 60_000
      if (aStart < bEnd && bStart < aEnd) {
        conflicted.add(a.id)
        conflicted.add(b.id)
      }
    }
  }
  return conflicted
}

export function CalendarClient({ visits }: { visits: VisitWithListing[] }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [selectedVisit, setSelectedVisit] = useState<VisitWithListing | null>(null)
  const [view, setView] = useState<'week' | 'list'>('week')

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const conflicted = useMemo(() => detectConflicts(visits), [visits])

  const visitsByDay = useMemo(() => {
    const map = new Map<string, VisitWithListing[]>()
    for (const v of visits) {
      const d = new Date(v.visit_at)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(v)
    }
    return map
  }, [visits])

  function getVisitsForDay(day: Date): VisitWithListing[] {
    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`
    return (visitsByDay.get(key) ?? []).sort(
      (a, b) => new Date(a.visit_at).getTime() - new Date(b.visit_at).getTime()
    )
  }

  const today = new Date()
  const upcomingCount = visits.filter(v => v.status === 'scheduled' && new Date(v.visit_at) >= today).length
  const conflictCount = conflicted.size > 0 ? [...conflicted].filter(id => {
    const v = visits.find(x => x.id === id)
    return v?.status === 'scheduled' && new Date(v.visit_at) >= today
  }).length : 0

  const sortedVisits = useMemo(() =>
    [...visits].sort((a, b) => new Date(a.visit_at).getTime() - new Date(b.visit_at).getTime()),
    [visits]
  )

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">יומן ביקורים</h1>
          <p className="text-sm text-gray-500">
            {upcomingCount} ביקורים קרובים
            {conflictCount > 0 && (
              <span className="mr-2 text-red-500 font-medium">⚠ {conflictCount} התנגשויות</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('week')}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${view === 'week' ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            שבוע
          </button>
          <button
            onClick={() => setView('list')}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${view === 'list' ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            רשימה
          </button>
        </div>
      </div>

      {/* Conflict warning */}
      {conflictCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <span className="font-semibold">שים לב:</span> יש ביקורים חופפים בזמן! סמנים באדום.
        </div>
      )}

      {view === 'week' ? (
        <>
          {/* Week navigation */}
          <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm">
            <button
              onClick={() => setWeekStart(d => addDays(d, -7))}
              className="text-gray-500 hover:text-gray-900 p-1"
            >
              ›
            </button>
            <span className="text-sm font-medium text-gray-700">
              {weekDays[0].getDate()} {MONTHS_HE[weekDays[0].getMonth()]} –{' '}
              {weekDays[6].getDate()} {MONTHS_HE[weekDays[6].getMonth()]} {weekDays[6].getFullYear()}
            </span>
            <button
              onClick={() => setWeekStart(d => addDays(d, 7))}
              className="text-gray-500 hover:text-gray-900 p-1"
            >
              ‹
            </button>
          </div>

          {/* Week grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((day, i) => {
              const dayVisits = getVisitsForDay(day)
              const isToday = sameDay(day, today)
              return (
                <div
                  key={i}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isToday ? 'border-blue-300' : 'border-gray-100'}`}
                >
                  {/* Day header */}
                  <div className={`px-2 py-1.5 text-center border-b ${isToday ? 'bg-blue-600' : 'bg-gray-50 border-gray-100'}`}>
                    <div className={`text-xs ${isToday ? 'text-blue-100' : 'text-gray-400'}`}>{DAYS_HE[day.getDay()]}</div>
                    <div className={`text-sm font-bold ${isToday ? 'text-white' : 'text-gray-700'}`}>{day.getDate()}</div>
                  </div>
                  {/* Visits */}
                  <div className="p-1 space-y-1 min-h-[80px]">
                    {dayVisits.map(v => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVisit(v)}
                        className={`w-full text-right text-xs p-1.5 rounded-lg border transition-all hover:opacity-80 ${STATUS_COLORS[v.status]} ${conflicted.has(v.id) ? 'ring-2 ring-red-400' : ''}`}
                      >
                        <div className="font-semibold">
                          {new Date(v.visit_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="truncate leading-tight opacity-80">
                          {v.visitor_name || '—'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        /* List view */
        <div className="space-y-2">
          {sortedVisits.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
              <div className="text-4xl mb-3">📅</div>
              <p>אין ביקורים</p>
            </div>
          ) : (
            sortedVisits.map(v => (
              <div
                key={v.id}
                onClick={() => setSelectedVisit(v)}
                className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:border-blue-200 transition-colors ${conflicted.has(v.id) ? 'border-red-300' : 'border-gray-100'}`}
              >
                <div className="text-center shrink-0 w-16">
                  <div className="text-xs text-gray-400">
                    {new Date(v.visit_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                  </div>
                  <div className="text-base font-bold text-gray-900">
                    {new Date(v.visit_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">
                    {v.visitor_name || 'מבקר לא ידוע'}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {v.listing_title || ''}{v.listing_address ? ` · ${v.listing_address}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {conflicted.has(v.id) && v.status === 'scheduled' && (
                    <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">חפיפה</span>
                  )}
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[v.status]}`}>
                    {STATUS_LABELS[v.status]}
                  </span>
                  <Link
                    href={`/dashboard/listings/${v.listing_id}/visits`}
                    onClick={e => e.stopPropagation()}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    נכס
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Visit detail modal */}
      {selectedVisit && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedVisit(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-3"
            dir="rtl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">פרטי ביקור</h2>
              <button onClick={() => setSelectedVisit(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
            </div>

            <div className="space-y-2 text-sm">
              <Row label="תאריך">
                {new Date(selectedVisit.visit_at).toLocaleString('he-IL', {
                  weekday: 'long', day: 'numeric', month: 'long',
                  hour: '2-digit', minute: '2-digit',
                })}
              </Row>
              <Row label="משך">{selectedVisit.duration_minutes} דקות</Row>
              <Row label="מבקר">{selectedVisit.visitor_name || '—'}</Row>
              {selectedVisit.visitor_phone && (
                <Row label="טלפון">
                  <a href={`tel:${selectedVisit.visitor_phone}`} className="text-blue-600 hover:underline">
                    {selectedVisit.visitor_phone}
                  </a>
                </Row>
              )}
              {selectedVisit.visitor_email && <Row label="אימייל">{selectedVisit.visitor_email}</Row>}
              <Row label="נכס">
                {selectedVisit.listing_title || '—'}
                {selectedVisit.listing_address && <span className="text-gray-400"> · {selectedVisit.listing_address}</span>}
              </Row>
              <Row label="סטטוס">
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[selectedVisit.status]}`}>
                  {STATUS_LABELS[selectedVisit.status]}
                </span>
              </Row>
              {selectedVisit.notes && <Row label="הערות">{selectedVisit.notes}</Row>}
              {conflicted.has(selectedVisit.id) && selectedVisit.status === 'scheduled' && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-red-600 text-xs font-medium">
                  ⚠ ביקור זה חופף עם ביקור אחר
                </div>
              )}
            </div>

            <Link
              href={`/dashboard/listings/${selectedVisit.listing_id}/visits`}
              className="block text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              ניהול ביקורים לנכס זה
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 shrink-0 w-16">{label}:</span>
      <span className="text-gray-800">{children}</span>
    </div>
  )
}
