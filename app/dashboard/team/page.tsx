'use client'

import { useState, useEffect } from 'react'
import type { Agent } from '@/lib/db/types'

type SafeAgent = Omit<Agent, 'password_hash' | 'invitation_token'>

const ROLE_LABELS = { admin: 'מנהל', agent: 'נציג' }

export default function TeamPage() {
  const [agents, setAgents] = useState<SafeAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  async function loadAgents() {
    const res = await fetch('/api/agents')
    if (res.ok) {
      const d = (await res.json()) as { agents: SafeAgent[] }
      setAgents(d.agents)
    }
    setLoading(false)
  }

  useEffect(() => { void loadAgents() }, [])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`למחוק את ${name}?`)) return
    await fetch(`/api/agents/${id}`, { method: 'DELETE' })
    setAgents((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">ניהול צוות</h1>
        <button
          onClick={() => { setShowInvite(true); setInviteLink(null) }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          + הזמן נציג
        </button>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <InviteForm
          onClose={() => setShowInvite(false)}
          onInvited={(link) => { setInviteLink(link); void loadAgents() }}
        />
      )}

      {inviteLink && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm">
          <p className="font-medium text-green-800 mb-2">קישור הזמנה נוצר</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border border-green-200 rounded-lg px-3 py-1.5 text-green-700 text-xs truncate" dir="ltr">
              {inviteLink}
            </code>
            <button
              onClick={() => void navigator.clipboard.writeText(inviteLink)}
              className="shrink-0 text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              העתק
            </button>
          </div>
          <p className="text-green-600 text-xs mt-2">
            {process.env.NEXT_PUBLIC_EMAIL_CONFIGURED ? 'הקישור נשלח גם במייל.' : 'EMAIL_SERVER לא מוגדר — שלח את הקישור ידנית.'}
          </p>
        </div>
      )}

      {/* Agent list */}
      {loading ? (
        <p className="text-gray-400 text-sm">טוען...</p>
      ) : agents.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-10">אין נציגים עדיין</p>
      ) : (
        <div className="divide-y divide-gray-100 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {agents.map((agent) => (
            <AgentRow key={agent.id} agent={agent} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

function AgentRow({
  agent,
  onDelete,
}: {
  agent: SafeAgent
  onDelete: (id: string, name: string) => void
}) {
  const isPending = !!agent.invitation_expires_at
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {agent.photo_url ? (
        <img src={agent.photo_url} alt={agent.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
          {agent.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 text-sm">{agent.name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {ROLE_LABELS[agent.role]}
          </span>
          {isPending && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
              ממתין לאישור
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">{agent.email}</p>
      </div>
      <button
        onClick={() => onDelete(agent.id, agent.name)}
        className="shrink-0 text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded transition-colors"
      >
        הסר
      </button>
    </div>
  )
}

function InviteForm({
  onClose,
  onInvited,
}: {
  onClose: () => void
  onInvited: (inviteUrl: string) => void
}) {
  const [form, setForm] = useState({ name: '', email: '', role: 'agent', phone: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const d = (await res.json()) as { inviteUrl: string }
      onInvited(d.inviteUrl)
      onClose()
    } else {
      const d = (await res.json()) as { error?: string }
      setError(d.error ?? 'שגיאה')
    }
    setSaving(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">הזמן נציג חדש</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">שם מלא</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">מייל</label>
            <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" dir="ltr" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">טלפון</label>
            <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">תפקיד</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="agent">נציג</option>
              <option value="admin">מנהל</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-xl hover:bg-gray-50 transition-colors">
            ביטול
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
            {saving ? 'שולח...' : 'שלח הזמנה'}
          </button>
        </div>
      </form>
    </div>
  )
}
