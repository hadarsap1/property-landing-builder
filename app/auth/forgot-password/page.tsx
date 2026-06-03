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
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gray-900">PropBuilder</Link>
          <p className="text-sm text-gray-500 mt-2">איפוס סיסמה</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
          {done ? (
            <div className="text-center space-y-3">
              <div className="text-4xl">📧</div>
              <p className="font-semibold text-gray-800">אם המייל קיים במערכת, שלחנו קישור לאיפוס</p>
              <p className="text-sm text-gray-500">בדוק את תיבת הדואר שלך (כולל ספאם). הקישור תקף לשעה אחת.</p>
              <Link href="/auth/login?mode=commercial" className="block text-sm text-blue-600 hover:underline mt-4">
                חזרה לכניסה
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-gray-500">
                הזן את כתובת המייל שלך ונשלח לך קישור לאיפוס הסיסמה.
              </p>

              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">כתובת מייל</label>
                <input
                  id="email"
                  type="email"
                  required
                  dir="ltr"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="agent@agency.co.il"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                {loading ? 'שולח...' : 'שלח קישור לאיפוס'}
              </button>

              <p className="text-center text-xs text-gray-400">
                <Link href="/auth/login?mode=commercial" className="text-blue-600 hover:underline">
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
