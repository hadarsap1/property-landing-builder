'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setDone(true) // always show success to prevent email enumeration
    } catch {
      setError('שגיאת רשת — נסה שנית')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f7f5f2' }} dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold" style={{ color: '#111' }}>PropBuilder</Link>
          <p className="text-sm mt-2" style={{ color: '#888' }}>איפוס סיסמה</p>
        </div>

        <div className="rounded-2xl p-8 space-y-5" style={{ background: '#fff', border: '2px solid #111' }}>
          {done ? (
            <div className="text-center space-y-3">
              <div className="text-4xl">📧</div>
              <p className="font-semibold" style={{ color: '#111' }}>אם המייל קיים במערכת, שלחנו קישור לאיפוס</p>
              <p className="text-sm" style={{ color: '#888' }}>בדוק את תיבת הדואר שלך (כולל ספאם). הקישור תקף לשעה אחת.</p>
              <Link href="/auth/login?mode=commercial" className="block text-sm hover:underline mt-4" style={{ color: '#c0392b' }}>
                חזרה לכניסה
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm" style={{ color: '#888' }}>
                הזן את כתובת המייל שלך ונשלח לך קישור לאיפוס הסיסמה.
              </p>

              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium" style={{ color: '#111' }}>כתובת מייל</label>
                <input
                  id="email"
                  type="email"
                  required
                  dir="ltr"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="agent@agency.co.il"
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                  style={{ border: '2px solid #111', background: '#f7f5f2' }}
                />
              </div>

              {error && (
                <p className="text-sm rounded-xl px-4 py-2" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full font-semibold py-2.5 rounded-xl transition-colors text-sm"
                style={{ background: loading ? '#888' : '#c0392b', color: '#fff' }}
              >
                {loading ? 'שולח...' : 'שלח קישור לאיפוס'}
              </button>

              <p className="text-center text-xs">
                <Link href="/auth/login?mode=commercial" className="hover:underline" style={{ color: '#c0392b' }}>
                  חזרה לכניסה
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
