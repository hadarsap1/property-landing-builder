'use client'

import { useState, useEffect } from 'react'
import type { Subscription } from '@/lib/db/types'

interface SubRow extends Subscription {
  agency_name: string
  agency_slug: string
}

const STATUS_LABELS: Record<string, string> = {
  trialing: 'ניסיון',
  active:   'פעיל',
  past_due: 'תשלום נכשל',
  canceled: 'בוטל',
  unpaid:   'לא שולם',
}

const STATUS_COLORS: Record<string, string> = {
  trialing: 'bg-blue-900 text-blue-300',
  active:   'bg-green-900 text-green-300',
  past_due: 'bg-red-900 text-red-300',
  canceled: 'bg-gray-700 text-gray-400',
  unpaid:   'bg-red-900 text-red-300',
}

export default function AdminBillingPage() {
  const [subs, setSubs] = useState<SubRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetch('/api/admin/subscriptions')
      .then(r => r.json())
      .then((d: { subscriptions?: SubRow[] }) => { setSubs(d.subscriptions ?? []); setLoading(false) })
  }, [])

  async function toggleOverride(agencyId: string, current: boolean) {
    const res = await fetch(`/api/admin/subscriptions/${agencyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manual_override: !current }),
    })
    if (res.ok) {
      setSubs(prev => prev.map(s =>
        s.agency_id === agencyId ? { ...s, manual_override: !current } : s
      ))
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">ניהול מנויים</h1>

      {loading ? (
        <p className="text-gray-400">טוען...</p>
      ) : subs.length === 0 ? (
        <p className="text-gray-400">אין מנויים עדיין</p>
      ) : (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-gray-700">
                <th className="text-right px-5 py-3 font-medium">סוכנות</th>
                <th className="text-right px-5 py-3 font-medium">סטטוס</th>
                <th className="text-right px-5 py-3 font-medium">תוכנית</th>
                <th className="text-right px-5 py-3 font-medium">תאריך סיום</th>
                <th className="text-right px-5 py-3 font-medium">ניסיון עד</th>
                <th className="text-right px-5 py-3 font-medium">Override ידני</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {subs.map((s) => (
                <tr key={s.id} className="text-gray-200">
                  <td className="px-5 py-3">
                    <div className="font-medium">{s.agency_name}</div>
                    <div className="text-xs text-gray-400 font-mono">{s.agency_slug}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status] ?? STATUS_COLORS.canceled}`}>
                      {STATUS_LABELS[s.status] ?? s.status}
                    </span>
                    {s.manual_override && (
                      <span className="mr-1 text-xs px-2 py-0.5 rounded-full font-medium bg-purple-900 text-purple-300" title="גישה מלאה מופעלת ידנית, ללא חיוב">
                        גישה ידנית
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-400">
                    {s.plan === 'monthly' ? 'חודשי' : s.plan === 'yearly' ? 'שנתי' : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {s.current_period_end
                      ? new Date(s.current_period_end).toLocaleDateString('he-IL')
                      : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {s.trial_ends_at
                      ? new Date(s.trial_ends_at).toLocaleDateString('he-IL')
                      : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => void toggleOverride(s.agency_id, s.manual_override)}
                      className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                        s.manual_override
                          ? 'bg-purple-800 text-purple-200 hover:bg-purple-700'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {s.manual_override ? 'בטל גישה ידנית' : 'פתח גישה ידנית'}
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
