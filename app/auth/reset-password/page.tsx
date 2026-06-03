'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const router = useRouter()

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!token) {
    return (
      <div className="text-center space-y-3">
        <p className="text-red-600 font-medium">קישור לאיפוס לא תקף</p>
        <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
          בקש קישור חדש
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirm) { setError('הסיסמאות אינן תואמות'); return }
    if (form.password.length < 8) { setError('הסיסמה חייבת להכיל לפחות 8 תווים'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: form.password }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) { setError(data.error ?? 'שגיאה — נסה שנית'); return }
      router.push('/auth/login?mode=commercial&reset=1')
    } catch {
      setError('שגיאת רשת — נסה שנית')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-gray-500">הזן סיסמה חדשה לחשבונך.</p>

      {[
        { id: 'password', label: 'סיסמה חדשה', ac: 'new-password' },
        { id: 'confirm',  label: 'אימות סיסמה', ac: 'new-password' },
      ].map(({ id, label, ac }) => (
        <div key={id} className="space-y-1">
          <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
          <input
            id={id}
            type="password"
            required
            dir="ltr"
            autoComplete={ac}
            value={form[id as keyof typeof form]}
            onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))}
            placeholder="לפחות 8 תווים"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      ))}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
      >
        {loading ? 'מעדכן...' : 'עדכן סיסמה'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gray-900">PropBuilder</Link>
          <p className="text-sm text-gray-500 mt-2">הגדרת סיסמה חדשה</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <Suspense fallback={<p className="text-sm text-gray-400 text-center">טוען...</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
