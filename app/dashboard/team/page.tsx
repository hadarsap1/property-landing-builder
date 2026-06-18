'use client'

import { useState, useEffect } from 'react'
import type { Agent } from '@/lib/db/types'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

type SafeAgent = Omit<Agent, 'password_hash' | 'invitation_token'> & {
  listing_count?: number
  lead_count?: number
}

const ROLE_LABELS = { admin: 'מנהל', agent: 'נציג' }
const ROLE_DESC = {
  admin: 'גישה מלאה: ניהול נכסים, לידים, אנליטיקס, צוות והגדרות',
  agent: 'יכול ליצור ולערוך נכסים ולצפות בלידים',
}

export default function TeamPage() {
  const [agents, setAgents] = useState<SafeAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; listing_count: number; lead_count: number } | null>(null)

  async function loadAgents() {
    const res = await fetch('/api/agents')
    if (res.ok) {
      const d = (await res.json()) as { agents: SafeAgent[] }
      setAgents(d.agents)
    }
    setLoading(false)
  }

  useEffect(() => { void loadAgents() }, [])

  async function confirmDelete(id: string) {
    setDeleteTarget(null)
    await fetch(`/api/agents/${id}`, { method: 'DELETE' })
    setAgents((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: '#111' }}>ניהול צוות</h1>
        <button
          onClick={() => { setShowInvite(true); setInviteLink(null) }}
          className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          style={{ background: '#111', color: '#f7f5f2' }}
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
        <div className="rounded-xl p-4 text-sm" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <p className="font-medium mb-2" style={{ color: '#166534' }}>קישור הזמנה נוצר</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg px-3 py-1.5 text-xs truncate" style={{ background: '#fff', border: '1px solid #bbf7d0', color: '#166534' }} dir="ltr">
              {inviteLink}
            </code>
            <button
              onClick={() => void navigator.clipboard.writeText(inviteLink)}
              className="shrink-0 text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: '#dcfce7', color: '#166534' }}
            >
              העתק
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: '#166534' }}>
            {process.env.NEXT_PUBLIC_EMAIL_CONFIGURED ? 'הקישור נשלח גם במייל.' : 'EMAIL_SERVER לא מוגדר — שלח את הקישור ידנית.'}
          </p>
        </div>
      )}

      {/* Agent list */}
      {loading ? (
        <div className="overflow-hidden animate-pulse" style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #e5e5e5' }}>
              <div className="w-10 h-10 rounded-full shrink-0" style={{ background: '#e5e5e5' }} />
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <div className="w-24 h-3.5 rounded" style={{ background: '#e5e5e5' }} />
                  <div className="w-14 h-3.5 rounded" style={{ background: '#f3f4f6' }} />
                </div>
                <div className="w-36 h-3 rounded" style={{ background: '#f3f4f6' }} />
              </div>
            </div>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <p className="text-sm text-center py-10" style={{ color: '#aaa' }}>אין נציגים עדיין</p>
      ) : (
        <div className="overflow-hidden" style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px' }}>
          {agents.map((agent) => (
            <AgentRow key={agent.id} agent={agent} onDelete={(id, name, lc, ld) => setDeleteTarget({ id, name, listing_count: lc, lead_count: ld })} />
          ))}
        </div>
      )}
    <ConfirmDialog
      open={deleteTarget !== null}
      message={(() => {
        if (!deleteTarget) return ''
        const parts = [`למחוק את ${deleteTarget.name}?`]
        const items = []
        if (deleteTarget.listing_count > 0) items.push(`${deleteTarget.listing_count} נכסים פעילים`)
        if (deleteTarget.lead_count > 0) items.push(`${deleteTarget.lead_count} לידים`)
        if (items.length > 0) parts.push(`לנציג זה ${items.join(' ו-')} — הם יישארו במערכת אך ללא נציג משויך.`)
        parts.push('פעולה זו לא ניתנת לביטול.')
        return parts.join(' ')
      })()}
      confirmLabel="מחק"
      danger
      onConfirm={() => { if (deleteTarget) void confirmDelete(deleteTarget.id) }}
      onCancel={() => setDeleteTarget(null)}
    />
    </div>
  )
}

function AgentRow({
  agent,
  onDelete,
}: {
  agent: SafeAgent
  onDelete: (id: string, name: string, listingCount: number, leadCount: number) => void
}) {
  const isPending = !!agent.invitation_expires_at
  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #e5e5e5' }}>
      {agent.photo_url ? (
        <img src={agent.photo_url} alt={agent.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0" style={{ background: '#f7f5f2', border: '2px solid #111', color: '#111' }}>
          {agent.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm" style={{ color: '#111' }}>{agent.name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#f7f5f2', color: '#888', border: '1px solid #e5e5e5' }}>
            {ROLE_LABELS[agent.role]}
          </span>
          {isPending && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#fefce8', color: '#a16207', border: '1px solid #fde047' }}>
              ממתין לאישור
            </span>
          )}
        </div>
        <p className="text-xs truncate" style={{ color: '#888' }}>{agent.email}</p>
      </div>
      <button
        onClick={() => onDelete(agent.id, agent.name, agent.listing_count ?? 0, agent.lead_count ?? 0)}
        className="shrink-0 text-xs px-2 py-1 rounded transition-colors hover:underline"
        style={{ color: '#c0392b' }}
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
  const [form, setForm] = useState({ name: '', email: '', role: 'agent', phone: '', calendly_url: '' })
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

  const inputStyle: React.CSSProperties = {
    border: '2px solid #111',
    background: '#f7f5f2',
    borderRadius: '8px',
  }

  return (
    <div className="p-5 space-y-4" style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px' }}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold" style={{ color: '#111' }}>הזמן נציג חדש</h2>
        <button onClick={onClose} className="text-xl leading-none" style={{ color: '#888' }}>✕</button>
      </div>

      {error && (
        <p className="text-sm rounded-lg p-3" style={{ color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca' }}>
          {error}
        </p>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#111' }}>שם מלא</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm focus:outline-none"
              style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#111' }}>מייל</label>
            <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 text-sm focus:outline-none"
              style={inputStyle} dir="ltr" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#111' }}>טלפון</label>
            <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full px-3 py-2 text-sm focus:outline-none"
              style={inputStyle} dir="ltr" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#111' }}>תפקיד</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full px-3 py-2 text-sm focus:outline-none"
              style={{ ...inputStyle, background: '#f7f5f2' }}>
              <option value="agent">נציג</option>
              <option value="admin">מנהל</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium mb-1" style={{ color: '#111' }}>
              תפקיד — <span className="font-normal" style={{ color: '#aaa' }}>{ROLE_DESC[form.role as keyof typeof ROLE_DESC]}</span>
            </label>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium mb-1" style={{ color: '#111' }}>קישור Calendly (אופציונלי)</label>
            <input type="url" value={form.calendly_url} onChange={e => setForm(f => ({ ...f, calendly_url: e.target.value }))}
              placeholder="https://calendly.com/your-name"
              className="w-full px-3 py-2 text-sm focus:outline-none"
              style={inputStyle} dir="ltr" />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 text-sm font-medium py-2 rounded-xl transition-colors"
            style={{ border: '2px solid #111', color: '#111', background: '#f7f5f2' }}>
            ביטול
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 text-sm font-semibold py-2 rounded-xl transition-colors disabled:opacity-50"
            style={{ background: '#111', color: '#f7f5f2' }}>
            {saving ? 'שולח...' : 'שלח הזמנה'}
          </button>
        </div>
      </form>
    </div>
  )
}
