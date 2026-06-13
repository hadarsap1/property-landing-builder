'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GoogleSignInButton } from '../_google-button'

export default function RegisterForm({ trialDays }: { trialDays: number }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', agency_name: '', email: '', password: '', confirm: '' })
  const [agreedToTerms, setAgreedToTerms] = useState(false)
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

    if (!agreedToTerms) { setError('יש לאשר את תנאי השימוש ומדיניות הפרטיות'); return }
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
    <main className="min-h-screen" dir="rtl">
      <div className="min-h-screen flex flex-col md:flex-row" dir="ltr">

        {/* ── Branding panel (left, desktop only) ── */}
        <div
          className="hidden md:flex md:w-[52%] flex-col justify-between px-14 py-12 relative overflow-hidden"
          style={{ background: 'linear-gradient(150deg, #1c1826 0%, #100e18 100%)' }}
          dir="rtl"
        >
          <div
            className="absolute pointer-events-none"
            style={{
              inset: 0,
              background: 'radial-gradient(ellipse at 30% 60%, rgba(212,168,83,0.08) 0%, transparent 65%)',
            }}
          />
          <div
            className="absolute pointer-events-none opacity-[0.04]"
            style={{
              inset: 0,
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          <div className="relative">
            <Link href="/" className="text-2xl font-bold text-white tracking-tight">
              Prop<span style={{ color: '#d4a853' }}>Builder</span>
            </Link>
          </div>

          <div className="relative space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white leading-tight mb-2">
                הצטרפו לאלפי
              </h2>
              <p className="text-xl font-semibold" style={{ color: '#d4a853' }}>
                סוכנים ומתווכים מצליחים
              </p>
            </div>

            <ul className="space-y-5">
              {[
                {
                  icon: '✅',
                  title: `ניסיון חינם ל-${trialDays} ימים`,
                  desc: 'ללא כרטיס אשראי, ביטול בכל עת',
                },
                {
                  icon: '⚡',
                  title: 'פעיל תוך 3 דקות',
                  desc: 'מדף ריק לדף נחיתה מקצועי בשניות',
                },
                {
                  icon: '🔒',
                  title: 'מאובטח ופרטי',
                  desc: 'הנתונים שלך נשמרים מוצפנים ומוגנים',
                },
              ].map(({ icon, title, desc }) => (
                <li key={title} className="flex items-start gap-4">
                  <span className="text-2xl mt-0.5 shrink-0">{icon}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{title}</p>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                {['★', '★', '★', '★', '★'].map((s, i) => (
                  <span key={i} style={{ color: '#d4a853' }} className="text-sm">{s}</span>
                ))}
              </div>
              <p className="text-sm text-white/70 leading-relaxed mb-3">
                &quot;תוך שבוע הכפלנו את הלידים שלנו. הממשק פשוט, העברית מושלמת.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #d4a853, #b8892e)' }}
                >
                  מ
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">מיכל לוי</p>
                  <p className="text-white/40 text-xs">סוכנת נדל&quot;ן, חיפה</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Form panel ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gray-50 min-h-screen md:min-h-0" dir="rtl">
          <div className="mb-6 md:hidden text-center">
            <Link href="/" className="text-2xl font-bold text-gray-900">PropBuilder</Link>
          </div>

          <div className="w-full max-w-sm">
            <div className="text-center mb-6 hidden md:block">
              <p className="text-sm text-gray-500">הרשמה לחשבון מקצועי</p>
            </div>
            <div className="text-center mb-6 md:hidden">
              <p className="text-sm text-gray-500">הרשמה לחשבון מקצועי</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
              {error && (
                <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-200">
                  {error}
                </div>
              )}

              <GoogleSignInButton callbackUrl="/auth/broker-setup" label="הרשמה עם Google" />

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">או עם מייל וסיסמה</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {([
                  { id: 'name',        label: 'שם מלא',       type: 'text',     placeholder: 'ישראל ישראלי',         ac: 'name',         ltr: false },
                  { id: 'agency_name', label: 'שם הסוכנות',   type: 'text',     placeholder: 'סוכנות נדל״ן מצוינת', ac: 'organization', ltr: false },
                  { id: 'email',       label: 'כתובת מייל',   type: 'email',    placeholder: 'you@agency.co.il',     ac: 'email',        ltr: true  },
                  { id: 'password',    label: 'סיסמה',         type: 'password', placeholder: 'לפחות 8 תווים',       ac: 'new-password', ltr: true  },
                  { id: 'confirm',     label: 'אימות סיסמה',  type: 'password', placeholder: 'הקלד שוב',             ac: 'new-password', ltr: true  },
                ] as const).map(({ id, label, type, placeholder, ac, ltr }) => (
                  <div key={id} className="space-y-1">
                    <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
                    <input
                      id={id}
                      type={type}
                      required
                      dir={ltr ? 'ltr' : undefined}
                      autoComplete={ac}
                      value={form[id]}
                      onChange={set(id)}
                      placeholder={placeholder}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={e => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 shrink-0 accent-blue-600"
                  />
                  <span className="text-xs text-gray-500 leading-relaxed">
                    קראתי ואני מסכים/ה ל
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mx-1">תנאי השימוש</a>
                    ול
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mr-1">מדיניות הפרטיות</a>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading || !agreedToTerms}
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

          <p className="mt-8 text-xs text-gray-400 text-center">
            © {new Date().getFullYear()} PropBuilder · כל הזכויות שמורות
          </p>
        </div>

      </div>
    </main>
  )
}
