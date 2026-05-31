'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { Lead, LeadNote } from '@/lib/db/types'

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
  const [lead, setLead] = useState<Lead | null>(null)
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [loading, setLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const load = useCallback(async () => {
    const [leadRes, notesRes] = await Promise.all([
      fetch(`/api/leads/${id}`),
      fetch(`/api/leads/${id}/notes`),
    ])
    if (leadRes.ok) setLead((await leadRes.json() as { lead: Lead }).lead)
    if (notesRes.ok) setNotes((await notesRes.json() as { notes: LeadNote[] }).notes)
    setLoading(false)
  }, [id])

  useEffect(() => { void load() }, [load])

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

  if (loading) return <p className="text-gray-400 text-sm">טוען...</p>
  if (!lead) return <p className="text-gray-500 text-sm">ליד לא נמצא</p>

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/dashboard/leads" className="text-sm text-gray-400 hover:text-gray-600">← לידים</Link>
        <h1 className="text-xl font-bold text-gray-900 mt-1">{lead.name || 'אנונימי'}</h1>
        {(lead.phone || lead.email) && (
          <p className="text-sm text-gray-500 mt-0.5">
            {[lead.phone, lead.email].filter(Boolean).join(' · ')}
          </p>
        )}
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
