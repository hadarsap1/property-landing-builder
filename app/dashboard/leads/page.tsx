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

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<Lead['status'] | ''>('')

  useEffect(() => {
    setLoading(true)
    const qs = statusFilter ? `?status=${statusFilter}` : ''
    void fetch(`/api/leads${qs}`)
      .then(r => r.json())
      .then((d: { leads: Lead[] }) => { setLeads(d.leads); setLoading(false) })
  }, [statusFilter])

  const activePipeline: Lead['status'][] = ['new', 'contacted', 'visited', 'serious', 'offer_made']
  const activeLeads = leads.filter(l => activePipeline.includes(l.status))
  const otherLeads = leads.filter(l => !activePipeline.includes(l.status))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">לידים</h1>
        <span className="text-sm text-gray-500">{leads.length} סה"כ</span>
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
          <p className="text-sm">אין לידים עדיין. הם יופיעו כשמישהו ישאיר פרטים בעמוד הנכס.</p>
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
  return (
    <Link
      href={`/dashboard/leads/${lead.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
    >
      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
        {lead.name ? lead.name.charAt(0).toUpperCase() : '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 text-sm">{lead.name || 'אנונימי'}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status]}`}>
            {STATUS_LABELS[lead.status]}
          </span>
          <span className="text-xs text-gray-400">{SOURCE_LABELS[lead.source]}</span>
        </div>
        <p className="text-xs text-gray-500 truncate">
          {[lead.phone, lead.email].filter(Boolean).join(' · ') || '—'}
        </p>
      </div>
      <span className="text-xs text-gray-400 shrink-0">{since}</span>
    </Link>
  )
}
