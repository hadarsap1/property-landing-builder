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
          style={{ background: '#111' }}
          dir="rtl"
        >
          <div className="relative">
            <Link href="/" className="text-2xl font-bold tracking-tight" style={{ color: '#f7f5f2' }}>
              Prop<span style={{ color: '#c0392b' }}>Builder</span>
            </Link>
          </div>

          <div className="relative space-y-8">
            <div>
              <h2 className="text-3xl font-bold leading-tight mb-2" style={{ color: '#f7f5f2' }}>
                הצטרפו לאלפי
              </h2>
              <p className="text-xl font-semibold" style={{ color: '#c0392b' }}>
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
                    <p className="font-semibold text-sm" style={{ color: '#f7f5f2' }}>{title}</p>
                    <p className="text-sm" style={{ color: 'rgba(247,245,242,0.55)' }}>{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'rgba(247,245,242,0.05)',
                border: '1px solid rgba(247,245,242,0.12)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                {['★', '★', '★', '★', '★'].map((s, i) => (
                  <span key={i} style={{ color: '#c0392b' }} className="text-sm">{s}</span>
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(247,245,242,0.7)' }}>
                &quot;תוך שבוע הכפלנו את הלידים שלנו. הממשק פשוט, העברית מושלמת.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: '#c0392b', color: '#fff' }}
                >
                  מ
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#f7f5f2' }}>מיכל לוי</p>
                  <p className="text-xs" style={{ color: 'rgba(247,245,242,0.4)' }}>סוכנת נדל&quot;ן, חיפה</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Form panel ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 min-h-screen md:min-h-0" style={{ background: '#f7f5f2' }} dir="rtl">
          <div className="mb-6 md:hidden text-center">
            <Link href="/" className="text-2xl font-bold" style={{ color: '#111' }}>PropBuilder</Link>
          </div>

          <div className="w-full max-w-sm">
            <div className="text-center mb-6 hidden md:block">
              <p className="text-sm" style={{ color: '#888' }}>הרשמה לחשבון מקצועי</p>
            </div>
            <div className="text-center mb-6 md:hidden">
              <p className="text-sm" style={{ color: '#888' }}>הרשמה לחשבון מקצועי</p>
            </div>

            <div className="rounded-2xl p-8 space-y-5" style={{ background: '#fff', border: '2px solid #111' }}>
              {error && (
                <div className="text-sm rounded-xl px-4 py-3" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                  {error}
                </div>
              )}

              <GoogleSignInButton callbackUrl="/auth/broker-setup" label="הרשמה עם Google" />

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: '#e5e5e5' }} />
                <span className="text-xs" style={{ color: '#aaa' }}>או עם מייל וסיסמה</span>
                <div className="flex-1 h-px" style={{ background: '#e5e5e5' }} />
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
                    <label htmlFor={id} className="text-sm font-medium" style={{ color: '#111' }}>{label}</label>
                    <input
                      id={id}
                      type={type}
                      required
                      dir={ltr ? 'ltr' : undefined}
                      autoComplete={ac}
                      value={form[id]}
                      onChange={set(id)}
                      placeholder={placeholder}
                      className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                      style={{ border: '2px solid #111', background: '#f7f5f2' }}
                    />
                  </div>
                ))}

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={e => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 shrink-0"
                  />
                  <span className="text-xs leading-relaxed" style={{ color: '#888' }}>
                    קראתי ואני מסכים/ה ל
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:underline mx-1" style={{ color: '#c0392b' }}>תנאי השימוש</a>
                    ול
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline mr-1" style={{ color: '#c0392b' }}>מדיניות הפרטיות</a>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading || !agreedToTerms}
                  className="w-full font-semibold py-2.5 rounded-xl transition-colors text-sm"
                  style={{ background: loading || !agreedToTerms ? '#888' : '#c0392b', color: '#fff' }}
                >
                  {loading ? 'יוצר חשבון...' : 'צור חשבון'}
                </button>
              </form>

              <p className="text-center text-xs" style={{ color: '#888' }}>
                ניסיון חינם ל-{trialDays} ימים · ללא כרטיס אשראי
              </p>
              <p className="text-center text-xs" style={{ color: '#aaa' }}>
                כבר יש לך חשבון?{' '}
                <Link href="/auth/login?mode=commercial" className="hover:underline" style={{ color: '#c0392b' }}>כניסה</Link>
              </p>
            </div>
          </div>

          <p className="mt-8 text-xs text-center" style={{ color: '#aaa' }}>
            © {new Date().getFullYear()} PropBuilder · כל הזכויות שמורות
          </p>
        </div>

      </div>
    </main>
  )
}
