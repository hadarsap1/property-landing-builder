'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Lead } from '@/lib/db/types'
import type { LeadWithListing } from '@/lib/db/queries/leads'

const STATUS_LABELS: Record<Lead['status'], string> = {
  new: 'חדש',
  contacted: 'נוצר קשר',
  visited: 'ביקר',
  serious: 'רציני',
  irrelevant: 'לא רלוונטי',
  offer_made: 'הצעה',
  closed: 'סגור',
}

const STATUS_STYLES: Record<Lead['status'], React.CSSProperties> = {
  new: { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' },
  contacted: { background: '#fefce8', color: '#a16207', border: '1px solid #fde047' },
  visited: { background: '#faf5ff', color: '#7e22ce', border: '1px solid #d8b4fe' },
  serious: { background: '#fff7ed', color: '#c2410c', border: '1px solid #fdba74' },
  irrelevant: { background: '#f9fafb', color: '#9ca3af', border: '1px solid #e5e7eb' },
  offer_made: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' },
  closed: { background: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db' },
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
  const [leads, setLeads] = useState<LeadWithListing[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<Lead['status'] | ''>('')
  const [sourceFilter, setSourceFilter] = useState<Lead['source'] | ''>('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('') // debounced value actually sent
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<NewCandidate>(EMPTY_CANDIDATE)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setFetchError(null)
    const p = new URLSearchParams()
    if (statusFilter) p.set('status', statusFilter)
    if (sourceFilter) p.set('source', sourceFilter)
    if (query) p.set('q', query)
    void fetch(`/api/leads?${p.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error('server error')
        return r.json()
      })
      .then((d: { leads: LeadWithListing[] }) => { setLeads(d.leads); setLoading(false) })
      .catch(() => { setFetchError('שגיאה בטעינת הלידים — נסה לרענן את הדף'); setLoading(false) })
  }, [statusFilter, sourceFilter, query])

  // Debounce the search box
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])

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
      // Candidates have no listing — pad the listing fields to match LeadWithListing shape
      const enriched: LeadWithListing = { ...lead, listing_title: null, listing_slug: null, listing_city: null, open_house_date: null, open_house_end: null }
      setLeads(prev => [enriched, ...prev])
      setForm(EMPTY_CANDIDATE)
      setShowModal(false)
    } finally {
      setSaving(false)
    }
  }

  const activePipeline: Lead['status'][] = ['new', 'contacted', 'visited', 'serious', 'offer_made']
  const activeLeads = leads.filter(l => activePipeline.includes(l.status))
  const otherLeads = leads.filter(l => !activePipeline.includes(l.status))

  const inputStyle: React.CSSProperties = {
    border: '2px solid #111',
    background: '#f7f5f2',
    borderRadius: '8px',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#111' }}>לידים וקונים</h1>
          <p className="text-xs mt-0.5" style={{ color: '#aaa' }}>לידים מנכסים + קונים פוטנציאליים</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: '#888' }}>{leads.length} סה&quot;כ</span>
          <button
            onClick={() => {
              const p = new URLSearchParams()
              if (statusFilter) p.set('status', statusFilter)
              if (sourceFilter) p.set('source', sourceFilter)
              if (query) p.set('q', query)
              window.location.href = `/api/leads/export?${p.toString()}`
            }}
            className="text-xs px-3 py-2 rounded-xl transition-colors"
            style={{ border: '2px solid #111', color: '#111', background: 'transparent' }}
          >
            ⬇ ייצוא CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            style={{ background: '#c0392b', color: '#fff' }}
          >
            + קונה חדש
          </button>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setStatusFilter('')}
          className="shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
          style={statusFilter === '' ? { background: '#111', color: '#f7f5f2' } : { background: '#f3f4f6', color: '#6b7280' }}
        >
          הכל
        </button>
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s === statusFilter ? '' : s)}
            className="shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
            style={statusFilter === s ? { background: '#111', color: '#f7f5f2' } : STATUS_STYLES[s]}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Search + source filter */}
      <div className="space-y-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם, טלפון או מייל..."
          className="w-full sm:max-w-sm px-4 py-2 text-sm focus:outline-none"
          style={inputStyle}
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSourceFilter('')}
            className="shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
            style={sourceFilter === '' ? { background: '#111', color: '#f7f5f2' } : { background: '#f3f4f6', color: '#6b7280' }}
          >
            כל המקורות
          </button>
          {(Object.keys(SOURCE_LABELS) as Lead['source'][]).map(src => (
            <button
              key={src}
              onClick={() => setSourceFilter(src === sourceFilter ? '' : src)}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
              style={sourceFilter === src ? { background: '#111', color: '#f7f5f2' } : { background: '#f3f4f6', color: '#6b7280' }}
            >
              {SOURCE_LABELS[src]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LeadsSkeleton />
      ) : fetchError ? (
        <div className="text-center py-20">
          <div className="text-3xl mb-3">⚠️</div>
          <p className="text-sm" style={{ color: '#c0392b' }}>{fetchError}</p>
          <button
            onClick={() => setStatusFilter(s => s)}
            className="mt-4 text-sm hover:underline"
            style={{ color: '#c0392b' }}
          >
            נסה שוב
          </button>
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-20" style={{ color: '#aaa' }}>
          <div className="text-4xl mb-3">📬</div>
          <p className="text-sm">אין לידים עדיין. הם יופיעו כשמישהו ישאיר פרטים בעמוד הנכס,</p>
          <p className="text-sm">או לחץ &quot;+ קונה חדש&quot; להוסיף קונה שהתקשר אליך ישירות.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeLeads.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#888' }}>
                פייפליין ({activeLeads.length})
              </h2>
              <div className="overflow-hidden" style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px' }}>
                {activeLeads.map(l => <LeadRow key={l.id} lead={l} />)}
              </div>
            </section>
          )}
          {otherLeads.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#888' }}>
                ארכיון ({otherLeads.length})
              </h2>
              <div className="overflow-hidden opacity-75" style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px' }}>
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
          <div className="w-full max-w-md p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-2rem)]" style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px' }} dir="rtl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: '#111' }}>קונה פוטנציאלי חדש</h2>
              <button onClick={() => setShowModal(false)} className="text-xl leading-none" style={{ color: '#888' }}>×</button>
            </div>
            <p className="text-xs" style={{ color: '#888' }}>מישהו שהתקשר לשאול על נכסים — לא בהכרח נכס ספציפי</p>

            {formError && (
              <div className="text-sm rounded-xl px-4 py-3" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                {formError}
              </div>
            )}

            <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium" style={{ color: '#111' }}>שם</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={setField('name')}
                    placeholder="ישראל ישראלי"
                    className="w-full px-3 py-2 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: '#111' }}>טלפון</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={setField('phone')}
                    placeholder="05X-XXX-XXXX"
                    className="w-full px-3 py-2 text-sm focus:outline-none"
                    style={inputStyle}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: '#111' }}>מייל</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={setField('email')}
                    placeholder="buyer@email.com"
                    className="w-full px-3 py-2 text-sm focus:outline-none"
                    style={inputStyle}
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="pt-4 space-y-3" style={{ borderTop: '1px solid #e5e5e5' }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#888' }}>מה הקונה מחפש</p>
                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: '#111' }}>תקציב (₪)</label>
                  <input
                    type="number"
                    value={form.budget}
                    onChange={setField('budget')}
                    placeholder="3000000"
                    className="w-full px-3 py-2 text-sm focus:outline-none"
                    style={inputStyle}
                    dir="ltr"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: '#111' }}>חדרים מינימום</label>
                    <input
                      type="number"
                      step="0.5"
                      value={form.rooms_min}
                      onChange={setField('rooms_min')}
                      placeholder="3"
                      className="w-full px-3 py-2 text-sm focus:outline-none"
                      style={inputStyle}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: '#111' }}>חדרים מקסימום</label>
                    <input
                      type="number"
                      step="0.5"
                      value={form.rooms_max}
                      onChange={setField('rooms_max')}
                      placeholder="5"
                      className="w-full px-3 py-2 text-sm focus:outline-none"
                      style={inputStyle}
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium" style={{ color: '#111' }}>אזורים מבוקשים</label>
                  <input
                    type="text"
                    value={form.desired_areas}
                    onChange={setField('desired_areas')}
                    placeholder="תל אביב, רמת גן, גבעתיים"
                    className="w-full px-3 py-2 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 text-sm font-medium py-2.5 rounded-xl transition-colors"
                  style={{ border: '2px solid #111', color: '#111', background: '#f7f5f2' }}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  style={{ background: '#c0392b', color: '#fff' }}
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
    <div className="overflow-hidden animate-pulse" style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px' }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #e5e5e5' }}>
          <div className="w-9 h-9 rounded-full shrink-0" style={{ background: '#e5e5e5' }} />
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <div className="w-24 h-3.5 rounded" style={{ background: '#e5e5e5' }} />
              <div className="w-14 h-3.5 rounded" style={{ background: '#f3f4f6' }} />
            </div>
            <div className="w-36 h-3 rounded" style={{ background: '#f3f4f6' }} />
          </div>
          <div className="w-12 h-3 rounded shrink-0" style={{ background: '#f3f4f6' }} />
        </div>
      ))}
    </div>
  )
}

function LeadRow({ lead }: { lead: LeadWithListing }) {
  const since = new Date(lead.created_at).toLocaleDateString('he-IL')
  const isCandidate = !lead.listing_id
  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50" style={{ borderBottom: '1px solid #e5e5e5' }}>
      <Link
        href={`/dashboard/leads/${lead.id}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0"
          style={isCandidate
            ? { background: '#faf5ff', color: '#7e22ce' }
            : { background: '#eff6ff', color: '#1d4ed8' }}
        >
          {lead.name ? lead.name.charAt(0).toUpperCase() : '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm" style={{ color: '#111' }}>{lead.name || 'אנונימי'}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={STATUS_STYLES[lead.status]}>
              {STATUS_LABELS[lead.status]}
            </span>
            {isCandidate ? (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#faf5ff', color: '#7e22ce', border: '1px solid #d8b4fe' }}>
                קונה
              </span>
            ) : (
              <span className="text-xs" style={{ color: '#aaa' }}>{SOURCE_LABELS[lead.source]}</span>
            )}
          </div>
          <p className="text-xs truncate" style={{ color: '#888' }}>
            {[lead.phone, lead.email].filter(Boolean).join(' · ') || '—'}
            {isCandidate && lead.desired_areas && ` · ${lead.desired_areas}`}
          </p>
        </div>
      </Link>
      {lead.listing_id && lead.listing_title && (
        <Link
          href={`/dashboard/listings/${lead.listing_id}/edit`}
          className="shrink-0 max-w-[180px] text-xs rounded-lg px-2.5 py-1.5 font-medium transition-colors flex items-center gap-1"
          style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
          title={lead.listing_title}
        >
          <span>🏠</span>
          <span className="truncate">{lead.listing_title}</span>
        </Link>
      )}
      <span className="text-xs shrink-0" style={{ color: '#aaa' }}>{since}</span>
    </div>
  )
}
