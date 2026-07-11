'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { Lead, LeadNote, PropertyVisit } from '@/lib/db/types'
import type { LeadWithListing } from '@/lib/db/queries/leads'

function formatWaPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('972')) return digits
  if (digits.startsWith('0')) return `972${digits.slice(1)}`
  return `972${digits}`
}

function buildWhatsAppReminderUrl(lead: LeadWithListing): string {
  if (!lead.phone || !lead.open_house_date) return ''
  const d = new Date(lead.open_house_date)
  const dateStr = d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
  const timeStr = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  const title = lead.listing_title ?? 'הנכס'
  const city = lead.listing_city ? ` ב${lead.listing_city}` : ''
  const nameGreet = lead.name ? `שלום ${lead.name}! ` : ''
  const msg = `${nameGreet}תזכורת: מחר, ${dateStr} בשעה ${timeStr}, יתקיים בית פתוח ל${title}${city}. נשמח לראותך!`
  return `https://wa.me/${formatWaPhone(lead.phone)}?text=${encodeURIComponent(msg)}`
}

const VISIT_STATUS_LABELS: Record<PropertyVisit['status'], string> = {
  scheduled: 'מתוכנן',
  completed: 'הושלם',
  cancelled: 'בוטל',
  no_show: 'לא הגיע',
}

const VISIT_STATUS_COLORS: Record<PropertyVisit['status'], string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  no_show: 'bg-red-100 text-red-600',
}

const STATUS_OPTIONS: { value: Lead['status']; label: string }[] = [
  { value: 'new',        label: 'חדש' },
  { value: 'contacted',  label: 'נוצר קשר' },
  { value: 'visited',    label: 'ביקר' },
  { value: 'serious',    label: 'רציני' },
  { value: 'irrelevant', label: 'לא רלוונטי' },
  { value: 'offer_made', label: 'הצעה' },
  { value: 'closed',     label: 'סגור' },
]

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [lead, setLead] = useState<LeadWithListing | null>(null)
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [visits, setVisits] = useState<PropertyVisit[]>([])
  const [loading, setLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [team, setTeam] = useState<{ id: string; name: string }[]>([])
  const [assigning, setAssigning] = useState(false)

  const load = useCallback(async () => {
    try {
      const [leadRes, notesRes, visitsRes, teamRes] = await Promise.all([
        fetch(`/api/leads/${id}`),
        fetch(`/api/leads/${id}/notes`),
        fetch(`/api/leads/${id}/visits`),
        fetch('/api/agents'),
      ])
      if (leadRes.ok) setLead((await leadRes.json() as { lead: LeadWithListing }).lead)
      if (notesRes.ok) setNotes((await notesRes.json() as { notes: LeadNote[] }).notes)
      if (visitsRes.ok) setVisits((await visitsRes.json() as { visits: PropertyVisit[] }).visits)
      if (teamRes.ok) setTeam((await teamRes.json() as { agents: { id: string; name: string }[] }).agents)
    } catch {
      // network failure — show what we have
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { void load() }, [load])

  async function assign(agentId: string) {
    setAssigning(true)
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_agent_id: agentId || null }),
      })
      if (res.ok) {
        setLead(prev => prev ? { ...prev, assigned_agent_id: agentId || null } : prev)
      }
    } finally {
      setAssigning(false)
    }
  }

  async function changeStatus(status: Lead['status']) {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) setLead(prev => prev ? { ...prev, status } : prev)
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault()
    if (!noteText.trim()) return
    setSavingNote(true)
    const res = await fetch(`/api/leads/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        note: noteText.trim(),
        follow_up_at: followUpDate || undefined,
      }),
    })
    if (res.ok) {
      const { note } = (await res.json()) as { note: LeadNote }
      setNotes(prev => [note, ...prev])
      setNoteText('')
      setFollowUpDate('')
    }
    setSavingNote(false)
  }

  async function markDone(noteId: string) {
    const res = await fetch(`/api/lead-notes/${noteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ follow_up_done: true }),
    })
    if (res.ok) {
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, follow_up_done: true } : n))
    }
  }

  if (loading) return (
    <div className="max-w-xl space-y-6 animate-pulse">
      <div className="h-4 w-24 bg-gray-200 rounded" />
      <div className="h-7 w-48 bg-gray-200 rounded" />
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded w-3/4" />)}
      </div>
    </div>
  )
  if (!lead) return <p className="text-gray-500 text-sm">ליד לא נמצא</p>

  const isCandidate = !lead.listing_id
  const hasPrefs = isCandidate && (lead.budget || lead.rooms_min || lead.rooms_max || lead.desired_areas)

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/dashboard/leads" className="text-sm text-gray-400 hover:text-gray-600">← לידים וקונים</Link>
        <div className="flex items-center gap-2 mt-1">
          <h1 className="text-xl font-bold text-gray-900">{lead.name || 'אנונימי'}</h1>
          {isCandidate && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">קונה</span>
          )}
        </div>
        {(lead.phone || lead.email) && (
          <p className="text-sm text-gray-500 mt-0.5">
            {[lead.phone, lead.email].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {/* Open-house WhatsApp reminder */}
      {lead.source === 'open_house' && lead.phone && (
        <div className="bg-green-50 rounded-2xl border border-green-100 p-4">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">תזכורת לבית פתוח</p>
          {lead.open_house_date && (
            <p className="text-sm text-gray-700 mb-3">
              {new Date(lead.open_house_date).toLocaleString('he-IL', {
                weekday: 'long', day: 'numeric', month: 'long',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          )}
          {buildWhatsAppReminderUrl(lead) ? (
            <a
              href={buildWhatsAppReminderUrl(lead)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <span>📱</span> שלח תזכורת בוואטסאפ
            </a>
          ) : (
            <p className="text-xs text-gray-400">אין תאריך בית פתוח מוגדר בנכס</p>
          )}
        </div>
      )}

      {/* Linked listing (non-candidates) */}
      {lead.listing_id && lead.listing_title && (
        <Link
          href={`/dashboard/listings/${lead.listing_id}/edit`}
          className="block bg-blue-50 hover:bg-blue-100 rounded-2xl border border-blue-100 p-4 transition-colors group"
        >
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">מתעניין/ת בנכס</p>
          <div className="flex items-center justify-between gap-3 mt-1.5">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">🏠 {lead.listing_title}</p>
              {lead.listing_city && (
                <p className="text-xs text-gray-500 mt-0.5">{lead.listing_city}</p>
              )}
            </div>
            <span className="shrink-0 text-blue-600 group-hover:text-blue-800 text-sm font-medium">פתח ←</span>
          </div>
        </Link>
      )}

      {/* Buyer preferences (candidates only) */}
      {hasPrefs && (
        <div className="bg-purple-50 rounded-2xl border border-purple-100 p-4 space-y-2">
          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">מה הקונה מחפש</p>
          <div className="flex flex-wrap gap-3 text-sm text-gray-700">
            {lead.budget && (
              <span>תקציב: <strong>{lead.budget.toLocaleString('he-IL')} ₪</strong></span>
            )}
            {(lead.rooms_min || lead.rooms_max) && (
              <span>
                חדרים: <strong>
                  {lead.rooms_min ?? '?'}
                  {lead.rooms_max && lead.rooms_max !== lead.rooms_min ? `–${lead.rooms_max}` : ''}
                </strong>
              </span>
            )}
            {lead.desired_areas && (
              <span>אזורים: <strong>{lead.desired_areas}</strong></span>
            )}
          </div>
        </div>
      )}

      {/* Assignment */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">נציג מטפל</p>
        <select
          value={lead.assigned_agent_id ?? ''}
          disabled={assigning}
          onChange={e => void assign(e.target.value)}
          className="w-full sm:w-64 border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
        >
          <option value="">ללא שיוך</option>
          {team.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {/* Status selector */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">סטטוס</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => void changeStatus(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors border ${
                lead.status === opt.value
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visits */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">ביקורים ({visits.length})</h2>
          <Link href="/dashboard/calendar" className="text-xs text-blue-600 hover:underline">
            יומן +
          </Link>
        </div>
        {visits.length === 0 ? (
          <p className="text-xs text-gray-400 bg-white border border-gray-200 rounded-2xl p-4 text-center">
            אין ביקורים מתוכננים. ניתן להוסיף ביומן או דרך עמוד הנכס.
          </p>
        ) : (
          <div className="space-y-2">
            {visits.map(v => (
              <Link
                key={v.id}
                href={v.listing_id ? `/dashboard/listings/${v.listing_id}/visits` : '/dashboard/calendar'}
                className="block bg-white rounded-xl border border-gray-200 p-3 hover:border-blue-200 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm">
                    <div className="font-semibold text-gray-900">
                      {new Date(v.visit_at).toLocaleString('he-IL', {
                        weekday: 'short', day: 'numeric', month: 'short',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {v.duration_minutes} דק׳ · {v.visit_type === 'seller' ? 'פגישת מוכר' : 'קונה'}
                    </div>
                    {v.notes && <div className="text-xs text-gray-400 mt-0.5">{v.notes}</div>}
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${VISIT_STATUS_COLORS[v.status]}`}>
                    {VISIT_STATUS_LABELS[v.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">פעילות והערות</h2>

        {/* Add note form */}
        <form onSubmit={(e) => void addNote(e)} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="הוסף הערה..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs text-gray-500 shrink-0">תזכורת:</label>
              <input
                type="datetime-local"
                value={followUpDate}
                onChange={e => setFollowUpDate(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              disabled={savingNote || !noteText.trim()}
              className="shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              {savingNote ? 'שומר...' : 'הוסף'}
            </button>
          </div>
        </form>

        {/* Notes list */}
        {notes.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">אין הערות עדיין</p>
        ) : (
          <div className="space-y-2">
            {notes.map(n => <NoteCard key={n.id} note={n} onMarkDone={markDone} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function NoteCard({ note, onMarkDone }: { note: LeadNote; onMarkDone: (id: string) => void }) {
  const hasFollowUp = !!note.follow_up_at
  const followUpPast = hasFollowUp && new Date(note.follow_up_at!) < new Date()
  const followUpLabel = hasFollowUp
    ? new Date(note.follow_up_at!).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })
    : null

  return (
    <div className={`bg-white rounded-xl border p-4 space-y-2 ${
      hasFollowUp && !note.follow_up_done && followUpPast
        ? 'border-orange-300 bg-orange-50'
        : 'border-gray-200'
    }`}>
      <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.note}</p>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs text-gray-400">
          {new Date(note.created_at).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}
        </span>
        {hasFollowUp && (
          <div className="flex items-center gap-2">
            <span className={`text-xs ${note.follow_up_done ? 'line-through text-gray-400' : followUpPast ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
              🔔 {followUpLabel}
            </span>
            {!note.follow_up_done && (
              <button
                onClick={() => onMarkDone(note.id)}
                className="text-xs text-green-600 hover:text-green-800 font-medium"
              >
                סיימתי
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
