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
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f7f5f2' }} dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏢</div>
          <h1 className="text-2xl font-bold" style={{ color: '#111' }}>הגדרת חשבון סוכנות</h1>
          <p className="text-sm mt-2" style={{ color: '#888' }}>מחובר כ-{name} ({email})</p>
        </div>

        <div className="rounded-2xl p-8 space-y-5" style={{ background: '#fff', border: '2px solid #111' }}>
          {error && (
            <div className="text-sm rounded-xl px-4 py-3" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="agencyName" className="text-sm font-medium" style={{ color: '#111' }}>שם הסוכנות</label>
              <input
                id="agencyName"
                type="text"
                required
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="סוכנות נדל״ן מצוינת"
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                style={{ border: '2px solid #111', background: '#f7f5f2' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full font-semibold py-2.5 rounded-xl transition-colors text-sm"
              style={{ background: loading ? '#888' : '#c0392b', color: '#fff' }}
            >
              {loading ? 'יוצר חשבון...' : 'צור חשבון סוכנות'}
            </button>
          </form>

          <p className="text-center text-xs" style={{ color: '#888' }}>ניסיון חינם ל-14 ימים · ללא כרטיס אשראי</p>
        </div>
      </div>
    </main>
  )
}
