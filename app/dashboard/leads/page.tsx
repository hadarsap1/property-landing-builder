'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Lead } from '@/lib/db/types'

const STATUS_LABELS: Record<Lead['status'], string> = {
  new: 'חדש',
  contacted: 'נוצר קשר',
  visited: 'ביקר',
  serious: 'רציני',
  irrelevant: 'לא רלוונטי',
  offer_made: 'הצעה',
  closed: 'סגור',
}

const STATUS_COLORS: Record<Lead['status'], string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  visited: 'bg-purple-100 text-purple-700',
  serious: 'bg-orange-100 text-orange-700',
  irrelevant: 'bg-gray-100 text-gray-400',
  offer_made: 'bg-green-100 text-green-700',
  closed: 'bg-gray-200 text-gray-500',
}

const SOURCE_LABELS: Record<Lead['source'], string> = {
  direct: 'טופס',
  booking: 'תיאום',
  open_house: 'בית פתוח',
  whatsapp: 'וואטסאפ',
}

const STATUSES = Object.keys(STATUS_LABELS) as Lead['status'][]

type NewCandidate = {
  name: string
  phone: string
  email: string
  budget: string
  rooms_min: string
  rooms_max: string
  desired_areas: string
}

const EMPTY_CANDIDATE: NewCandidate = {
  name: '', phone: '', email: '', budget: '',
  rooms_min: '', rooms_max: '', desired_areas: '',
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<Lead['status'] | ''>('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<NewCandidate>(EMPTY_CANDIDATE)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const qs = statusFilter ? `?status=${statusFilter}` : ''
    void fetch(`/api/leads${qs}`)
      .then(r => r.json())
      .then((d: { leads: Lead[] }) => { setLeads(d.leads); setLoading(false) })
      .catch(() => setLoading(false))
  }, [statusFilter])

  function setField(field: keyof NewCandidate) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!form.name.trim() && !form.phone.trim() && !form.email.trim()) {
      setFormError('נדרש לפחות שם, טלפון או מייל')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/leads/candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          budget: form.budget ? parseInt(form.budget) : undefined,
          rooms_min: form.rooms_min ? parseFloat(form.rooms_min) : undefined,
          rooms_max: form.rooms_max ? parseFloat(form.rooms_max) : undefined,
          desired_areas: form.desired_areas || undefined,
        }),
      })
      if (!res.ok) {
        const d = (await res.json()) as { error?: string }
        setFormError(d.error ?? 'שגיאה ביצירת הקונה')
        return
      }
      const { lead } = (await res.json()) as { lead: Lead }
      setLeads(prev => [lead, ...prev])
      setForm(EMPTY_CANDIDATE)
      setShowModal(false)
    } finally {
      setSaving(false)
    }
  }

  const activePipeline: Lead['status'][] = ['new', 'contacted', 'visited', 'serious', 'offer_made']
  const activeLeads = leads.filter(l => activePipeline.includes(l.status))
  const otherLeads = leads.filter(l => !activePipeline.includes(l.status))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">לידים וקונים</h1>
          <p className="text-xs text-gray-400 mt-0.5">לידים מנכסים + קונים פוטנציאליים</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{leads.length} סה&quot;כ</span>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            + קונה חדש
          </button>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setStatusFilter('')}
          className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
            statusFilter === '' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          הכל
        </button>
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s === statusFilter ? '' : s)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              statusFilter === s ? 'bg-gray-900 text-white' : `${STATUS_COLORS[s]} hover:opacity-80`
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <LeadsSkeleton />
      ) : leads.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">📬</div>
          <p className="text-sm">אין לידים עדיין. הם יופיעו כשמישהו ישאיר פרטים בעמוד הנכס,</p>
          <p className="text-sm">או לחץ &quot;+ קונה חדש&quot; להוסיף קונה שהתקשר אליך ישירות.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeLeads.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                פייפליין ({activeLeads.length})
              </h2>
              <div className="divide-y divide-gray-100 bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {activeLeads.map(l => <LeadRow key={l.id} lead={l} />)}
              </div>
            </section>
          )}
          {otherLeads.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                ארכיון ({otherLeads.length})
              </h2>
              <div className="divide-y divide-gray-100 bg-white rounded-2xl border border-gray-200 overflow-hidden opacity-75">
                {otherLeads.map(l => <LeadRow key={l.id} lead={l} />)}
              </div>
            </section>
          )}
        </div>
      )}

      {/* New candidate modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-2rem)]" dir="rtl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">קונה פוטנציאלי חדש</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <p className="text-xs text-gray-500">מישהו שהתקשר לשאול על נכסים — לא בהכרח נכס ספציפי</p>

            {formError && (
              <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium text-gray-700">שם</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={setField('name')}
                    placeholder="ישראל ישראלי"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">טלפון</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={setField('phone')}
                    placeholder="05X-XXX-XXXX"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">מייל</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={setField('email')}
                    placeholder="buyer@email.com"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">מה הקונה מחפש</p>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">תקציב (₪)</label>
                  <input
                    type="number"
                    value={form.budget}
                    onChange={setField('budget')}
                    placeholder="3000000"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dir="ltr"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">חדרים מינימום</label>
                    <input
                      type="number"
                      step="0.5"
                      value={form.rooms_min}
                      onChange={setField('rooms_min')}
                      placeholder="3"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">חדרים מקסימום</label>
                    <input
                      type="number"
                      step="0.5"
                      value={form.rooms_max}
                      onChange={setField('rooms_max')}
                      placeholder="5"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">אזורים מבוקשים</label>
                  <input
                    type="text"
                    value={form.desired_areas}
                    onChange={setField('desired_areas')}
                    placeholder="תל אביב, רמת גן, גבעתיים"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  {saving ? 'שומר...' : 'הוסף קונה'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function LeadsSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
          <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <div className="w-24 h-3.5 bg-gray-200 rounded" />
              <div className="w-14 h-3.5 bg-gray-100 rounded" />
            </div>
            <div className="w-36 h-3 bg-gray-100 rounded" />
          </div>
          <div className="w-12 h-3 bg-gray-100 rounded shrink-0" />
        </div>
      ))}
    </div>
  )
}

function LeadRow({ lead }: { lead: Lead }) {
  const since = new Date(lead.created_at).toLocaleDateString('he-IL')
  const isCandidate = !lead.listing_id
  return (
    <Link
      href={`/dashboard/leads/${lead.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${
        isCandidate ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
      }`}>
        {lead.name ? lead.name.charAt(0).toUpperCase() : '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 text-sm">{lead.name || 'אנונימי'}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status]}`}>
            {STATUS_LABELS[lead.status]}
          </span>
          {isCandidate ? (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-50 text-purple-600">
              קונה
            </span>
          ) : (
            <span className="text-xs text-gray-400">{SOURCE_LABELS[lead.source]}</span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">
          {[lead.phone, lead.email].filter(Boolean).join(' · ') || '—'}
          {isCandidate && lead.desired_areas && ` · ${lead.desired_areas}`}
        </p>
      </div>
      <span className="text-xs text-gray-400 shrink-0">{since}</span>
    </Link>
  )
}
