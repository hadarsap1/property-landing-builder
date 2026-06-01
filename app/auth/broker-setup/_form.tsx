'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function BrokerSetupForm({ name, email }: { name: string; email: string }) {
  const { update } = useSession()
  const router = useRouter()
  const [agencyName, setAgencyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!agencyName.trim()) { setError('יש להזין שם סוכנות'); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/auth/broker-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyName: agencyName.trim() }),
      })
      let data: { agencyId?: string; role?: string; error?: string } = {}
      try { data = await res.json() } catch { /* non-json */ }
      if (!res.ok) { setError(data.error ?? 'שגיאה — נסה שוב'); setLoading(false); return }
      // Refresh session JWT with commercial credentials
      await update({ userType: 'commercial', agencyId: data.agencyId, role: data.role ?? 'admin' })
      router.push('/dashboard')
    } catch {
      setError('שגיאת חיבור — נסה שוב')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏢</div>
          <h1 className="text-2xl font-bold text-gray-900">הגדרת חשבון סוכנות</h1>
          <p className="text-sm text-gray-500 mt-2">מחובר כ-{name} ({email})</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-200">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="agencyName" className="text-sm font-medium text-gray-700">שם הסוכנות</label>
              <input
                id="agencyName"
                type="text"
                required
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="סוכנות נדל״ן מצוינת"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              {loading ? 'יוצר חשבון...' : 'צור חשבון סוכנות'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500">ניסיון חינם ל-14 ימים · ללא כרטיס אשראי</p>
        </div>
      </div>
    </main>
  )
}
