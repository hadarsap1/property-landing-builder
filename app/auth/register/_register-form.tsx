'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { googleSignInAction } from '../login/actions'
import { GoogleSignInButton } from '../_google-button'

export default function RegisterForm({ trialDays }: { trialDays: number }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', agency_name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirm) { setError('הסיסמאות אינן תואמות'); return }
    if (form.password.length < 8) { setError('הסיסמה חייבת להכיל לפחות 8 תווים'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, agency_name: form.agency_name, email: form.email, password: form.password }),
      })
      let data: { error?: string } = {}
      try { data = (await res.json()) as { error?: string } } catch { /* non-JSON body */ }
      if (!res.ok) { setError(data.error ?? `שגיאת שרת (${res.status}) — נסה שוב`); setLoading(false); return }
      router.push('/auth/login?mode=commercial&registered=1')
    } catch {
      setError('לא ניתן להגיע לשרת — בדוק חיבור לאינטרנט ונסה שוב')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gray-900">PropBuilder</Link>
          <p className="text-sm text-gray-500 mt-2">הרשמה לחשבון מקצועי</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-200">
              {error}
            </div>
          )}

          {/* Google sign-up — fastest path */}
          <GoogleSignInButton callbackUrl="/auth/broker-setup" label="הרשמה עם Google" />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">או עם מייל וסיסמה</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {([
              { id: 'name',        label: 'שם מלא',       type: 'text',     placeholder: 'ישראל ישראלי' },
              { id: 'agency_name', label: 'שם הסוכנות',   type: 'text',     placeholder: 'סוכנות נדל״ן מצוינת' },
              { id: 'email',       label: 'כתובת מייל',   type: 'email',    placeholder: 'you@agency.co.il' },
              { id: 'password',    label: 'סיסמה',         type: 'password', placeholder: 'לפחות 8 תווים' },
              { id: 'confirm',     label: 'אימות סיסמה',  type: 'password', placeholder: 'הקלד שוב' },
            ] as const).map(({ id, label, type, placeholder }) => (
              <div key={id} className="space-y-1">
                <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
                <input
                  id={id}
                  type={type}
                  required
                  value={form[id]}
                  onChange={set(id)}
                  placeholder={placeholder}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              {loading ? 'יוצר חשבון...' : 'צור חשבון'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500">
            ניסיון חינם ל-{trialDays} ימים · ללא כרטיס אשראי
          </p>
          <p className="text-center text-xs text-gray-400">
            כבר יש לך חשבון?{' '}
            <Link href="/auth/login?mode=commercial" className="text-blue-600 hover:underline">כניסה</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
