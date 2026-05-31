'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateAgencyForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ agency_name: '', admin_name: '', admin_email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch('/api/admin/agencies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = (await res.json()) as { inviteUrl?: string; error?: string }

    if (!res.ok) {
      setError(data.error ?? 'שגיאה ביצירת הסוכנות')
      setLoading(false)
      return
    }

    setInviteUrl(data.inviteUrl ?? null)
    setForm({ agency_name: '', admin_name: '', admin_email: '' })
    setLoading(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
      >
        + סוכנות חדשה
      </button>
    )
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white">יצירת סוכנות חדשה</h2>
        <button
          onClick={() => { setOpen(false); setInviteUrl(null); setError(null) }}
          className="text-gray-400 hover:text-white text-xl leading-none"
        >
          ×
        </button>
      </div>

      {inviteUrl ? (
        <div className="space-y-3">
          <div className="bg-green-900/40 border border-green-700 rounded-xl p-4">
            <p className="text-green-300 text-sm font-medium mb-2">הסוכנות נוצרה בהצלחה!</p>
            <p className="text-gray-300 text-xs mb-1">קישור הגדרת סיסמה (שלח למנהל הסוכנות):</p>
            <input
              readOnly
              value={inviteUrl}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-xs text-gray-200 font-mono focus:outline-none"
              onFocus={e => e.target.select()}
            />
          </div>
          <button
            onClick={() => { setInviteUrl(null); setOpen(false) }}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            סגור
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          {[
            { id: 'agency_name', label: 'שם הסוכנות',     placeholder: 'סוכנות נדל״ן לדוגמה' },
            { id: 'admin_name',  label: 'שם המנהל',        placeholder: 'ישראל ישראלי' },
            { id: 'admin_email', label: 'מייל המנהל',      placeholder: 'admin@agency.co.il' },
          ].map(({ id, label, placeholder }) => (
            <div key={id} className="space-y-1">
              <label className="text-xs font-medium text-gray-400">{label}</label>
              <input
                type={id === 'admin_email' ? 'email' : 'text'}
                required
                value={form[id as keyof typeof form]}
                onChange={set(id as keyof typeof form)}
                placeholder={placeholder}
                className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
            >
              {loading ? 'יוצר...' : 'צור וש שלח הזמנה'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setError(null) }}
              className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-2"
            >
              ביטול
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
