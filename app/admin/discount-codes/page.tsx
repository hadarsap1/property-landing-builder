'use client'

import { useState, useEffect } from 'react'
import type { DiscountCode } from '@/lib/db/types'

export default function AdminDiscountCodesPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    code: '',
    discount_pct: 20,
    max_uses: '',
    expires_at: '',
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void loadCodes()
  }, [])

  async function loadCodes() {
    const res = await fetch('/api/admin/discount-codes')
    if (res.ok) {
      const d = (await res.json()) as { codes: DiscountCode[] }
      setCodes(d.codes)
    }
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCreating(true)
    try {
      const res = await fetch('/api/admin/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          discount_pct: form.discount_pct,
          max_uses: form.max_uses ? parseInt(form.max_uses, 10) : null,
          expires_at: form.expires_at || null,
        }),
      })
      const data = (await res.json()) as { code?: DiscountCode; error?: string }
      if (!res.ok) { setError(data.error ?? 'שגיאה'); return }
      if (data.code) setCodes(prev => [data.code!, ...prev])
      setForm({ code: '', discount_pct: 20, max_uses: '', expires_at: '' })
    } catch {
      setError('שגיאת רשת')
    } finally {
      setCreating(false)
    }
  }

  async function toggleCode(id: string, active: boolean) {
    const res = await fetch('/api/admin/discount-codes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, active: !active }),
    })
    if (res.ok) setCodes(prev => prev.map(c => c.id === id ? { ...c, active: !active } : c))
  }

  async function deleteCode(id: string) {
    if (!confirm('למחוק קוד הנחה זה?')) return
    const res = await fetch('/api/admin/discount-codes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setCodes(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">קודי הנחה</h1>

      {/* Create form */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
        <h2 className="font-semibold text-white mb-4">קוד חדש</h2>
        <form onSubmit={(e) => void handleCreate(e)} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">קוד</label>
            <input
              type="text"
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="SUMMER30"
              required
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">הנחה (%)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={form.discount_pct}
              onChange={e => setForm(f => ({ ...f, discount_pct: parseInt(e.target.value, 10) || 0 }))}
              required
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">שימושים מקסימליים (ריק = ∞)</label>
            <input
              type="number"
              min={1}
              value={form.max_uses}
              onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
              placeholder="ללא הגבלה"
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">תפוגה (ריק = ∞)</label>
            <input
              type="date"
              value={form.expires_at}
              onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="ltr"
            />
          </div>

          {error && (
            <p className="sm:col-span-2 lg:col-span-4 text-sm text-red-400">{error}</p>
          )}

          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold px-6 py-2 rounded-xl text-sm transition-colors"
            >
              {creating ? 'יוצר...' : '+ צור קוד'}
            </button>
          </div>
        </form>
      </div>

      {/* Codes list */}
      {loading ? (
        <p className="text-gray-400">טוען...</p>
      ) : codes.length === 0 ? (
        <p className="text-gray-400">אין קודי הנחה עדיין</p>
      ) : (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-gray-700">
                <th className="text-right px-5 py-3 font-medium">קוד</th>
                <th className="text-right px-5 py-3 font-medium">הנחה</th>
                <th className="text-right px-5 py-3 font-medium">שימושים</th>
                <th className="text-right px-5 py-3 font-medium">תפוגה</th>
                <th className="text-right px-5 py-3 font-medium">סטטוס</th>
                <th className="text-right px-5 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {codes.map((c) => (
                <tr key={c.id} className="text-gray-200">
                  <td className="px-5 py-3 font-mono font-semibold text-white">{c.code}</td>
                  <td className="px-5 py-3 text-green-400 font-semibold">{c.discount_pct}%</td>
                  <td className="px-5 py-3 text-gray-400">
                    {c.uses_count}
                    {c.max_uses !== null ? ` / ${c.max_uses}` : ' / ∞'}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {c.expires_at
                      ? new Date(c.expires_at).toLocaleDateString('he-IL')
                      : '∞'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.active ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {c.active ? 'פעיל' : 'כבוי'}
                    </span>
                  </td>
                  <td className="px-5 py-3 flex gap-2">
                    <button
                      onClick={() => void toggleCode(c.id, c.active)}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      {c.active ? 'כבה' : 'הפעל'}
                    </button>
                    <button
                      onClick={() => void deleteCode(c.id)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      מחק
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
