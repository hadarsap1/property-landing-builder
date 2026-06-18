import Link from 'next/link'
import { loginAction } from './actions'
import { GoogleSignInButton } from '../_google-button'

type SP = { callbackUrl?: string; error?: string; mode?: string; upgraded?: string; registered?: string; reset?: string }

const INK = '#111'
const CREAM = '#f7f5f2'
const ACCENT = '#c0392b'

export default function LoginPage({ searchParams }: { searchParams: Promise<SP> }) {
  return (
    <main className="min-h-screen" dir="rtl">
      <div className="min-h-screen flex flex-col md:flex-row" dir="ltr">

        {/* ── Branding panel ── */}
        <div
          className="hidden md:flex md:w-[48%] flex-col justify-between px-14 py-12"
          style={{ background: CREAM, borderLeft: `2px solid ${INK}` }}
          dir="rtl"
        >
          <Link href="/" className="font-display font-black text-xl" style={{ letterSpacing: '-0.03em', color: INK }}>
            Prop<span style={{ color: ACCENT }}>Builder</span>
          </Link>

          <div className="space-y-10">
            <div>
              <h2 className="font-display font-black leading-tight mb-3" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', letterSpacing: '-0.03em', color: INK }}>
                שיווק נדל״ן
                <br />
                שנראה כמו שצריך
              </h2>
              <p className="text-base" style={{ color: '#666' }}>לסוכנויות ולמוכרים פרטיים</p>
            </div>

            <div style={{ borderTop: `2px solid ${INK}`, paddingTop: '32px' }}>
              <ul className="space-y-6">
                {[
                  { n: '01', title: 'דפי נחיתה מקצועיים', desc: 'צור תוך דקות, ללא קידוד, עם עיצוב שמוכר.' },
                  { n: '02', title: 'AI שכותב בעברית', desc: 'תיאורי נכסים שגורמים לאנשים לרצות לבוא.' },
                  { n: '03', title: 'ניהול לידים חכם', desc: 'מעקב, תזכורות ודוח ביצועים שבועי.' },
                ].map(({ n, title, desc }) => (
                  <li key={n} className="flex items-start gap-5">
                    <span className="font-display font-black text-2xl leading-none flex-shrink-0 mt-0.5" style={{ color: 'rgba(0,0,0,0.12)' }}>{n}</span>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: INK }}>{title}</p>
                      <p className="text-sm mt-0.5" style={{ color: '#777' }}>{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            className="p-6 rounded-lg"
            style={{ border: `2px solid ${INK}`, background: '#eceae6' }}
          >
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#444' }}>
              &quot;PropBuilder חסך לנו שעות עבודה בכל נכס. עכשיו כל הלידים נכנסים ישר ללוח הניהול.&quot;
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: INK, color: CREAM }}
              >
                ד
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: INK }}>דני כהן</p>
                <p className="text-xs" style={{ color: '#888' }}>מנהל סוכנות, תל אביב</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Form panel ── */}
        <div
          className="flex-1 flex flex-col items-center justify-center px-6 py-12 min-h-screen md:min-h-0"
          style={{ background: CREAM }}
          dir="rtl"
        >
          <div className="mb-8 md:hidden">
            <Link href="/" className="font-display font-black text-xl" style={{ letterSpacing: '-0.03em', color: INK }}>
              Prop<span style={{ color: ACCENT }}>Builder</span>
            </Link>
          </div>

          <div className="w-full max-w-sm">
            <LoginContent searchParams={searchParams} />
          </div>

          <p className="mt-8 text-xs text-center" style={{ color: '#aaa' }}>
            © {new Date().getFullYear()} PropBuilder · כל הזכויות שמורות
          </p>
        </div>

      </div>
    </main>
  )
}

async function LoginContent({ searchParams }: { searchParams: Promise<SP> }) {
  const { callbackUrl, error, mode, upgraded, registered, reset } = await searchParams
  const isCommercial = mode === 'commercial'

  return (
    <div
      className="rounded-lg p-8 space-y-6"
      style={{ border: `2px solid ${INK}`, background: '#fff' }}
    >
      {registered && (
        <div className="text-sm rounded-lg px-4 py-3" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
          החשבון נוצר בהצלחה! התחבר כדי להתחיל.
        </div>
      )}
      {reset && (
        <div className="text-sm rounded-lg px-4 py-3" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
          הסיסמה עודכנה בהצלחה! התחבר עם הסיסמה החדשה.
        </div>
      )}
      {upgraded && (
        <div className="text-sm rounded-lg px-4 py-3" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
          השדרוג הצליח! התחבר מחדש כדי להפעיל את הגישה המקצועית.
        </div>
      )}
      {error && (
        <div className="text-sm rounded-lg px-4 py-3" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
          {error === 'OAuthSignin' || error === 'CredentialsSignin' ? 'מייל או סיסמה שגויים' : 'שגיאה בכניסה. נסה שוב.'}
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex rounded-lg overflow-hidden text-sm font-semibold" style={{ border: `2px solid ${INK}` }}>
        <Link
          href={`/auth/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
          className="flex-1 py-2.5 text-center transition-colors"
          style={{ background: !isCommercial ? INK : 'transparent', color: !isCommercial ? CREAM : '#888' }}
        >
          מוכר פרטי
        </Link>
        <Link
          href={`/auth/login?mode=commercial${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
          className="flex-1 py-2.5 text-center transition-colors"
          style={{
            background: isCommercial ? INK : 'transparent',
            color: isCommercial ? CREAM : '#888',
            borderRight: `2px solid ${INK}`,
          }}
        >
          סוכן / מתווך
        </Link>
      </div>

      {!isCommercial ? (
        <div className="space-y-4">
          <p className="text-sm text-center" style={{ color: '#666' }}>
            התחבר עם Google כדי לשמור ולנהל את הנכסים שלך
          </p>
          <GoogleSignInButton callbackUrl={callbackUrl ?? '/personal'} />
          <p className="text-center text-xs" style={{ color: '#aaa' }}>
            עדיין אין לך חשבון? הכניסה יוצרת אחד אוטומטית
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <GoogleSignInButton callbackUrl={callbackUrl ?? '/dashboard'} label="כניסה עם Google" />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: '#e5e5e5' }} />
            <span className="text-xs" style={{ color: '#aaa' }}>או עם מייל וסיסמה</span>
            <div className="flex-1 h-px" style={{ background: '#e5e5e5' }} />
          </div>

          <form action={loginAction} className="space-y-4">
            <input type="hidden" name="callbackUrl" value={callbackUrl ?? '/dashboard'} />

            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium" style={{ color: INK }}>כתובת מייל</label>
              <input
                id="email" name="email" type="email" autoComplete="email" required dir="ltr"
                className="w-full px-4 py-2.5 text-sm rounded-lg focus:outline-none"
                style={{ border: `2px solid ${INK}`, background: CREAM }}
                placeholder="agent@agency.co.il"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium" style={{ color: INK }}>סיסמה</label>
              <input
                id="password" name="password" type="password" autoComplete="current-password" required dir="ltr"
                className="w-full px-4 py-2.5 text-sm rounded-lg focus:outline-none"
                style={{ border: `2px solid ${INK}`, background: CREAM }}
              />
            </div>

            <button
              type="submit"
              className="w-full font-bold py-3 rounded-lg text-sm transition-opacity hover:opacity-85"
              style={{ background: INK, color: CREAM }}
            >
              כניסה
            </button>

            <p className="text-center text-xs" style={{ color: '#aaa' }}>
              שכחת סיסמה?{' '}
              <Link href="/auth/forgot-password" className="underline" style={{ color: ACCENT }}>איפוס סיסמה</Link>
            </p>
            <p className="text-center text-xs" style={{ color: '#aaa' }}>
              אין לך חשבון?{' '}
              <Link href="/auth/register" className="underline" style={{ color: ACCENT }}>הרשמה חינם</Link>
            </p>
          </form>
        </div>
      )}
    </div>
  )
}
