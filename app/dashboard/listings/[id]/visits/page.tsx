'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { PropertyVisit } from '@/lib/db/types'

const STATUS_LABELS: Record<PropertyVisit['status'], string> = {
  scheduled: 'מתוכנן',
  completed: 'הושלם',
  cancelled: 'בוטל',
  no_show: 'לא הגיע',
}

const STATUS_COLORS: Record<PropertyVisit['status'], string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  no_show: 'bg-red-100 text-red-600',
}

function formatDate(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleString('he-IL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toLocalDatetimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const EMPTY_FORM = {
  visit_at: '',
  duration_minutes: '30',
  visit_type: 'buyer' as 'buyer' | 'seller',
  visitor_name: '',
  visitor_phone: '',
  visitor_email: '',
  notes: '',
}

export default function ListingVisitsPage() {
  const { id: listingId } = useParams<{ id: string }>()
  const [visits, setVisits] = useState<PropertyVisit[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deleteVisitId, setDeleteVisitId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [listingTitle, setListingTitle] = useState<string>('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/visits?listingId=${listingId}`)
    if (res.ok) {
      const data = await res.json() as { visits: PropertyVisit[] }
      setVisits(data.visits)
    }
    setLoading(false)
  }, [listingId])

  useEffect(() => {
    void load()
    // Fetch listing name from dashboard data
    fetch(`/api/listings/${listingId}`)
      .then(r => r.ok ? r.json() as Promise<{ listing: { ai_title?: string; title?: string; street?: string } }> : null)
      .then(d => {
        if (d?.listing) {
          setListingTitle(d.listing.ai_title || d.listing.title || d.listing.street || '')
        }
      })
      .catch(() => {})
  }, [listingId, load])

  function openForm() {
    const next = new Date()
    next.setHours(next.getHours() + 1, 0, 0, 0)
    setForm({ ...EMPTY_FORM, visit_at: toLocalDatetimeValue(next) })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.visit_at) return
    setSaving(true)
    const res = await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listingId,
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
      setShowForm(false)
      setForm(EMPTY_FORM)
      await load()
    }
    setSaving(false)
  }

  async function handleStatus(visitId: string, status: PropertyVisit['status']) {
    await fetch(`/api/visits/${visitId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await load()
  }

  async function handleDelete(visitId: string) {
    setDeleteVisitId(null)
    await fetch(`/api/visits/${visitId}`, { method: 'DELETE' })
    await load()
  }

  const upcoming = visits.filter(v => v.status === 'scheduled' && new Date(v.visit_at) >= new Date())
  const past = visits.filter(v => v.status !== 'scheduled' || new Date(v.visit_at) < new Date())

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">
            ← לוח הבקרה
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            ביקורים {listingTitle ? `— ${listingTitle}` : ''}
          </h1>
          <p className="text-sm text-gray-500">{upcoming.length} ביקורים קרובים</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/calendar"
            className="text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl px-4 py-2 transition-colors"
          >
            תצוגת יומן
          </Link>
          <button
            onClick={openForm}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            + ביקור חדש
          </button>
        </div>
      </div>

      {/* Add visit form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">ביקור חדש</h2>
          <form onSubmit={e => void handleSubmit(e)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
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
                <label className="block text-sm text-gray-600 mb-1">סוג ביקור</label>
                <select
                  value={form.visit_type}
                  onChange={e => setForm(f => ({ ...f, visit_type: e.target.value as 'buyer' | 'seller' }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="buyer">קונה פוטנציאלי</option>
                  <option value="seller">פגישת מוכר</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">משך (דקות)</label>
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
              <div>
                <label className="block text-sm text-gray-600 mb-1">שם מבקר</label>
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
                  dir="ltr"
                  value={form.visitor_phone}
                  onChange={e => setForm(f => ({ ...f, visitor_phone: e.target.value }))}
                  placeholder="050-0000000"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">אימייל</label>
                <input
                  type="email"
                  value={form.visitor_email}
                  onChange={e => setForm(f => ({ ...f, visitor_email: e.target.value }))}
                  placeholder="visitor@email.com"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
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
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">טוען...</div>
      ) : visits.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-gray-500">אין ביקורים מתוכננים עדיין</p>
          <button
            onClick={openForm}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
          >
            קבע ביקור ראשון
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">קרובים</h2>
              <div className="space-y-3">
                {upcoming.map(v => (
                  <VisitRow key={v.id} visit={v} onStatus={handleStatus} onDelete={setDeleteVisitId} />
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">עבר</h2>
              <div className="space-y-3">
                {past.map(v => (
                  <VisitRow key={v.id} visit={v} onStatus={handleStatus} onDelete={setDeleteVisitId} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    <ConfirmDialog
      open={deleteVisitId !== null}
      message="למחוק את הביקור? פעולה זו לא ניתנת לביטול."
      confirmLabel="מחק"
      danger
      onConfirm={() => { if (deleteVisitId) void handleDelete(deleteVisitId) }}
      onCancel={() => setDeleteVisitId(null)}
    />
    </div>
  )
}

function VisitRow({
  visit,
  onStatus,
  onDelete,
}: {
  visit: PropertyVisit
  onStatus: (id: string, status: PropertyVisit['status']) => Promise<void>
  onDelete: (id: string) => void
}) {
  const [busy, setBusy] = useState(false)

  async function changeStatus(status: PropertyVisit['status']) {
    setBusy(true)
    await onStatus(visit.id, status)
    setBusy(false)
  }

  function del() {
    onDelete(visit.id)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-4">
      <div className="text-center shrink-0 w-14">
        <div className="text-xs text-gray-400">
          {new Date(visit.visit_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
        </div>
        <div className="text-lg font-bold text-gray-900">
          {new Date(visit.visit_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="text-xs text-gray-400">{visit.duration_minutes} דק׳</div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
          {visit.lead_id ? (
            <Link href={`/dashboard/leads/${visit.lead_id}`} className="hover:underline">
              {visit.visitor_name || 'מבקר לא ידוע'}
            </Link>
          ) : (
            visit.visitor_name || 'מבקר לא ידוע'
          )}
          {visit.lead_id && (
            <span className="text-xs font-medium text-blue-600 bg-blue-50 rounded-full px-2 py-0.5">
              ליד מקושר
            </span>
          )}
        </div>
        {visit.visitor_phone && (
          <a href={`tel:${visit.visitor_phone}`} className="text-sm text-blue-600 hover:underline">
            {visit.visitor_phone}
          </a>
        )}
        {visit.visitor_email && (
          <div className="text-sm text-gray-500">{visit.visitor_email}</div>
        )}
        {visit.notes && (
          <div className="text-sm text-gray-400 mt-1">{visit.notes}</div>
        )}
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_COLORS[visit.status]}`}>
          {STATUS_LABELS[visit.status]}
        </span>
        {visit.status === 'scheduled' && (
          <div className="flex gap-1.5">
            <button
              onClick={() => void changeStatus('completed')}
              disabled={busy}
              className="text-xs text-green-600 hover:bg-green-50 rounded-lg px-2 py-1 transition-colors disabled:opacity-50"
            >
              הושלם
            </button>
            <button
              onClick={() => void changeStatus('no_show')}
              disabled={busy}
              className="text-xs text-orange-500 hover:bg-orange-50 rounded-lg px-2 py-1 transition-colors disabled:opacity-50"
            >
              לא הגיע
            </button>
            <button
              onClick={() => void changeStatus('cancelled')}
              disabled={busy}
              className="text-xs text-gray-400 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors disabled:opacity-50"
            >
              בטל
            </button>
          </div>
        )}
        <button
          onClick={() => void del()}
          disabled={busy}
          className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg px-2 py-1 transition-colors disabled:opacity-50"
        >
          מחק
        </button>
      </div>
    </div>
  )
}
