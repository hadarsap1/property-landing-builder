'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import type { PropertyVisit, Listing, Lead } from '@/lib/db/types'

type VisitWithListing = PropertyVisit & {
  listing_title: string | null
  listing_address: string | null
}

type LeadOption = Pick<Lead, 'id' | 'name' | 'phone' | 'email' | 'listing_id'>

type View = 'day' | 'week' | 'month'

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

const VISIT_TYPE_LABELS: Record<PropertyVisit['visit_type'], string> = {
  buyer: 'קונה פוטנציאלי',
  seller: 'פגישת מוכר',
}

const DAYS_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
const MONTHS_HE = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

function startOfWeek(d: Date): Date {
  const date = new Date(d)
  date.setDate(date.getDate() - date.getDay())
  date.setHours(0, 0, 0, 0)
  return date
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function startOfDay(d: Date): Date {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d)
  date.setDate(date.getDate() + n)
  return date
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function toLocalDatetimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function detectConflicts(visits: VisitWithListing[]): Set<string> {
  const conflicted = new Set<string>()
  const scheduled = visits.filter(v => v.status === 'scheduled')
  for (let i = 0; i < scheduled.length; i++) {
    for (let j = i + 1; j < scheduled.length; j++) {
      const a = scheduled[i], b = scheduled[j]
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

const EMPTY_FORM = {
  listing_id: '',
  lead_id: '',
  visit_at: '',
  duration_minutes: '30',
  visit_type: 'buyer' as 'buyer' | 'seller',
  visitor_name: '',
  visitor_phone: '',
  visitor_email: '',
  notes: '',
}

export function CalendarClient({
  visits: initialVisits,
  listings,
  leads,
}: {
  visits: VisitWithListing[]
  listings: Pick<Listing, 'id' | 'ai_title' | 'title' | 'street' | 'city'>[]
  leads: LeadOption[]
}) {
  const [visits, setVisits] = useState(initialVisits)
  const [view, setView] = useState<View>('week')
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()))
  const [selectedVisit, setSelectedVisit] = useState<VisitWithListing | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const today = useMemo(() => startOfDay(new Date()), [])
  const conflicted = useMemo(() => detectConflicts(visits), [visits])

  const upcomingCount = visits.filter(v => v.status === 'scheduled' && new Date(v.visit_at) >= today).length
  const conflictCount = [...conflicted].filter(id => {
    const v = visits.find(x => x.id === id)
    return v?.status === 'scheduled' && new Date(v.visit_at) >= today
  }).length

  // Navigation
  function goBack() {
    if (view === 'day') setAnchor(d => addDays(d, -1))
    else if (view === 'week') setAnchor(d => addDays(d, -7))
    else setAnchor(d => addMonths(d, -1))
  }
  function goForward() {
    if (view === 'day') setAnchor(d => addDays(d, 1))
    else if (view === 'week') setAnchor(d => addDays(d, 7))
    else setAnchor(d => addMonths(d, 1))
  }

  function navLabel() {
    if (view === 'day') {
      return anchor.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    }
    if (view === 'week') {
      const ws = startOfWeek(anchor)
      const we = addDays(ws, 6)
      return `${ws.getDate()} ${MONTHS_HE[ws.getMonth()]} – ${we.getDate()} ${MONTHS_HE[we.getMonth()]} ${we.getFullYear()}`
    }
    return `${MONTHS_HE[anchor.getMonth()]} ${anchor.getFullYear()}`
  }

  const getVisitsForDay = useCallback((day: Date) => {
    return visits
      .filter(v => sameDay(new Date(v.visit_at), day))
      .sort((a, b) => new Date(a.visit_at).getTime() - new Date(b.visit_at).getTime())
  }, [visits])

  function openAddForm(prefilledDate?: Date) {
    const base = prefilledDate ?? new Date()
    if (!prefilledDate) { base.setHours(base.getHours() + 1, 0, 0, 0) }
    setForm({ ...EMPTY_FORM, visit_at: toLocalDatetimeValue(base) })
    setShowAddForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.listing_id || !form.visit_at) return
    setSaving(true)
    const res = await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: form.listing_id,
        lead_id: form.lead_id || null,
        visit_at: new Date(form.visit_at).toISOString(),
        duration_minutes: parseInt(form.duration_minutes) || 30,
        visit_type: form.visit_type,
        visitor_name: form.visitor_name || null,
        visitor_phone: form.visitor_phone || null,
        visitor_email: form.visitor_email || null,
        notes: form.notes || null,
      }),
    })
    if (res.ok) {
      const data = await res.json() as { visit: VisitWithListing }
      const listing = listings.find(l => l.id === form.listing_id)
      const enriched: VisitWithListing = {
        ...data.visit,
        listing_title: listing ? (listing.ai_title || listing.title) : null,
        listing_address: listing ? [listing.street, listing.city].filter(Boolean).join(', ') : null,
      }
      setVisits(vs => [...vs, enriched])
      setShowAddForm(false)
      setForm(EMPTY_FORM)
    }
    setSaving(false)
  }

  // Views
  const weekDays = useMemo(() => {
    const ws = startOfWeek(anchor)
    return Array.from({ length: 7 }, (_, i) => addDays(ws, i))
  }, [anchor])

  const monthDays = useMemo(() => {
    const ms = startOfMonth(anchor)
    const firstDow = ms.getDay()
    const total = daysInMonth(anchor.getFullYear(), anchor.getMonth())
    const cells: (Date | null)[] = Array(firstDow).fill(null)
    for (let d = 1; d <= total; d++) {
      cells.push(new Date(anchor.getFullYear(), anchor.getMonth(), d))
    }
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [anchor])

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
          {(['day', 'week', 'month'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${view === v ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {{ day: 'יום', week: 'שבוע', month: 'חודש' }[v]}
            </button>
          ))}
          <button
            onClick={() => openAddForm()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            + ביקור חדש
          </button>
        </div>
      </div>

      {/* Conflict banner */}
      {conflictCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <span className="font-semibold">שים לב:</span> יש ביקורים חופפים בזמן — מסומנים בגבול אדום.
        </div>
      )}

      {/* Add visit modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAddForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-lg">ביקור חדש</h2>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={e => void handleSubmit(e)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">נכס *</label>
                  <select
                    required
                    value={form.listing_id}
                    onChange={e => setForm(f => ({ ...f, listing_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">בחר נכס...</option>
                    {listings.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.ai_title || l.title || [l.street, l.city].filter(Boolean).join(', ') || l.id.slice(0, 8)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">סוג ביקור</label>
                  <select
                    value={form.visit_type}
                    onChange={e => setForm(f => ({ ...f, visit_type: e.target.value as 'buyer' | 'seller', lead_id: '' }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="buyer">קונה פוטנציאלי</option>
                    <option value="seller">פגישת מוכר</option>
                  </select>
                </div>

                {form.visit_type === 'buyer' && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">חבר ללליד קיים (אופציונלי)</label>
                    <select
                      value={form.lead_id}
                      onChange={e => {
                        const leadId = e.target.value
                        const lead = leads.find(l => l.id === leadId)
                        setForm(f => ({
                          ...f,
                          lead_id: leadId,
                          visitor_name: lead?.name ?? f.visitor_name,
                          visitor_phone: lead?.phone ?? f.visitor_phone,
                          visitor_email: lead?.email ?? f.visitor_email,
                          listing_id: lead?.listing_id ?? f.listing_id,
                        }))
                      }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="">— ליד חדש —</option>
                      {leads.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.name || l.phone || l.email || l.id.slice(0, 8)}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                      אם תשאיר ריק, ייווצר ליד חדש אוטומטית כשתשמור.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-600 mb-1">משך</label>
                  <select
                    value={form.duration_minutes}
                    onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="15">15 דקות</option>
                    <option value="30">30 דקות</option>
                    <option value="45">45 דקות</option>
                    <option value="60">שעה</option>
                    <option value="90">שעה וחצי</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">תאריך ושעה *</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.visit_at}
                    onChange={e => setForm(f => ({ ...f, visit_at: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">שם</label>
                  <input
                    type="text"
                    value={form.visitor_name}
                    onChange={e => setForm(f => ({ ...f, visitor_name: e.target.value }))}
                    placeholder="ישראל ישראלי"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">טלפון</label>
                  <input
                    type="tel"
                    value={form.visitor_phone}
                    onChange={e => setForm(f => ({ ...f, visitor_phone: e.target.value }))}
                    placeholder="050-0000000"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">הערות</label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="הערות נוספות..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
                >
                  {saving ? 'שומר...' : 'שמור ביקור'}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Navigation bar. In RTL the first DOM child renders on the RIGHT.
          Right = previous (arrow points right/into-past).
          Left  = next     (arrow points left/into-future). */}
      <div className="flex items-center bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm gap-3">
        <button
          onClick={goBack}
          className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
          title="הקודם"
        >
          →
        </button>
        <button
          onClick={() => setAnchor(startOfDay(new Date()))}
          className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-2 py-1 transition-colors"
        >
          היום
        </button>
        <span className="flex-1 text-center text-sm font-medium text-gray-700">{navLabel()}</span>
        <button
          onClick={goForward}
          className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
          title="הבא"
        >
          ←
        </button>
      </div>

      {/* Day view */}
      {view === 'day' && (
        <DayView
          day={anchor}
          visits={getVisitsForDay(anchor)}
          conflicted={conflicted}
          onSelectVisit={setSelectedVisit}
          onAddAt={openAddForm}
          today={today}
        />
      )}

      {/* Week view */}
      {view === 'week' && (
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((day, i) => {
            const dayVisits = getVisitsForDay(day)
            const isToday = sameDay(day, today)
            return (
              <div key={i} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${isToday ? 'border-blue-300' : 'border-gray-100'}`}>
                <div
                  className={`px-2 py-1.5 text-center border-b cursor-pointer ${isToday ? 'bg-blue-600' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}
                  onClick={() => { setView('day'); setAnchor(startOfDay(day)) }}
                >
                  <div className={`text-xs ${isToday ? 'text-blue-100' : 'text-gray-400'}`}>{DAYS_HE[day.getDay()]}</div>
                  <div className={`text-sm font-bold ${isToday ? 'text-white' : 'text-gray-700'}`}>{day.getDate()}</div>
                </div>
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
                      <div className="truncate leading-tight opacity-80">{v.visitor_name || '—'}</div>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      const d = new Date(day)
                      d.setHours(10, 0, 0, 0)
                      openAddForm(d)
                    }}
                    className="w-full text-center text-gray-300 hover:text-gray-400 text-xs py-1 hover:bg-gray-50 rounded transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Month view */}
      {view === 'month' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS_HE.map(d => (
              <div key={d} className="text-center text-xs text-gray-400 font-medium py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-100" style={{ direction: 'ltr' }}>
            {monthDays.map((day, i) => {
              if (!day) return <div key={i} className="bg-gray-50 min-h-[80px]" />
              const dayVisits = getVisitsForDay(day)
              const isToday = sameDay(day, today)
              return (
                <div
                  key={i}
                  className={`min-h-[80px] p-1 cursor-pointer hover:bg-gray-50 transition-colors ${isToday ? 'bg-blue-50' : ''}`}
                  onClick={() => { setView('day'); setAnchor(startOfDay(day)) }}
                  style={{ direction: 'rtl' }}
                >
                  <div className={`text-xs font-medium mb-1 inline-flex w-6 h-6 items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-600'}`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayVisits.slice(0, 3).map(v => (
                      <div
                        key={v.id}
                        onClick={e => { e.stopPropagation(); setSelectedVisit(v) }}
                        className={`text-xs px-1 py-0.5 rounded truncate ${conflicted.has(v.id) ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}
                      >
                        {new Date(v.visit_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })} {v.visitor_name || '—'}
                      </div>
                    ))}
                    {dayVisits.length > 3 && (
                      <div className="text-xs text-gray-400">+{dayVisits.length - 3} עוד</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Visit detail modal */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedVisit(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-3" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">פרטי ביקור</h2>
              <button onClick={() => setSelectedVisit(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
            <div className="space-y-2 text-sm">
              <Row label="תאריך">
                {new Date(selectedVisit.visit_at).toLocaleString('he-IL', {
                  weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                })}
              </Row>
              <Row label="משך">{selectedVisit.duration_minutes} דקות</Row>
              <Row label="סוג">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${selectedVisit.visit_type === 'seller' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {VISIT_TYPE_LABELS[selectedVisit.visit_type]}
                </span>
              </Row>
              <Row label="שם">{selectedVisit.visitor_name || '—'}</Row>
              {selectedVisit.visitor_phone && (
                <Row label="טלפון">
                  <a href={`tel:${selectedVisit.visitor_phone}`} className="text-blue-600 hover:underline">{selectedVisit.visitor_phone}</a>
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

function DayView({
  day,
  visits,
  conflicted,
  onSelectVisit,
  onAddAt,
  today,
}: {
  day: Date
  visits: VisitWithListing[]
  conflicted: Set<string>
  onSelectVisit: (v: VisitWithListing) => void
  onAddAt: (d: Date) => void
  today: Date
}) {
  const hours = Array.from({ length: 16 }, (_, i) => i + 7) // 07:00 – 22:00

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {visits.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <div className="text-3xl mb-2">📅</div>
          <p className="text-sm">אין ביקורים ביום זה</p>
          <button
            onClick={() => {
              const d = new Date(day)
              d.setHours(10, 0, 0, 0)
              onAddAt(d)
            }}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            + הוסף ביקור
          </button>
        </div>
      )}
      {visits.map(v => (
        <div
          key={v.id}
          onClick={() => onSelectVisit(v)}
          className={`flex items-start gap-4 p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${conflicted.has(v.id) ? 'border-r-4 border-r-red-400' : ''}`}
        >
          <div className="text-center shrink-0 w-16">
            <div className="text-lg font-bold text-gray-900">
              {new Date(v.visit_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs text-gray-400">{v.duration_minutes} דק׳</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900">{v.visitor_name || 'מבקר לא ידוע'}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${v.visit_type === 'seller' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {v.visit_type === 'seller' ? 'מוכר' : 'קונה'}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[v.status]}`}>
                {STATUS_LABELS[v.status]}
              </span>
            </div>
            {v.visitor_phone && (
              <a href={`tel:${v.visitor_phone}`} className="text-sm text-blue-600 hover:underline block mt-0.5" onClick={e => e.stopPropagation()}>
                {v.visitor_phone}
              </a>
            )}
            <div className="text-sm text-gray-500 mt-0.5">
              {v.listing_title}{v.listing_address ? ` · ${v.listing_address}` : ''}
            </div>
            {v.notes && <div className="text-sm text-gray-400 mt-0.5">{v.notes}</div>}
            {conflicted.has(v.id) && v.status === 'scheduled' && (
              <div className="text-xs text-red-500 font-medium mt-1">⚠ חפיפה עם ביקור אחר</div>
            )}
          </div>
        </div>
      ))}
      {void hours}
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
