import Link from 'next/link'
import { loginAction } from './actions'
import { GoogleSignInButton } from '../_google-button'

type SP = { callbackUrl?: string; error?: string; mode?: string; upgraded?: string; registered?: string; reset?: string }

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SP>
}) {
  return (
    <main className="min-h-screen" dir="rtl">
      <div className="min-h-screen flex flex-col md:flex-row" dir="ltr">

        {/* ── Branding panel (left, desktop only) ── */}
        <div
          className="hidden md:flex md:w-[52%] flex-col justify-between px-14 py-12 relative overflow-hidden"
          style={{ background: 'linear-gradient(150deg, #1c1826 0%, #100e18 100%)' }}
          dir="rtl"
        >
          {/* Subtle radial glow */}
          <div
            className="absolute pointer-events-none"
            style={{
              inset: 0,
              background: 'radial-gradient(ellipse at 30% 60%, rgba(212,168,83,0.08) 0%, transparent 65%)',
            }}
          />
          {/* Dot-grid overlay */}
          <div
            className="absolute pointer-events-none opacity-[0.04]"
            style={{
              inset: 0,
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          {/* Top: logo */}
          <div className="relative">
            <Link href="/" className="text-2xl font-bold text-white tracking-tight">
              Prop<span style={{ color: '#d4a853' }}>Builder</span>
            </Link>
          </div>

          {/* Mid: value props */}
          <div className="relative space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white leading-tight mb-2">
                פלטפורמת שיווק הנדל&quot;ן
              </h2>
              <p className="text-xl font-semibold" style={{ color: '#d4a853' }}>
                המובילה בישראל
              </p>
            </div>

            <ul className="space-y-5">
              {[
                {
                  icon: '🏘️',
                  title: 'דפי נחיתה מקצועיים',
                  desc: 'צור תוך דקות, ללא קידוד, עם עיצוב שמוכר',
                },
                {
                  icon: '🤖',
                  title: 'AI שכותב בעברית',
                  desc: 'תיאורי נכסים שמדברים ללב הקונה',
                },
                {
                  icon: '📊',
                  title: 'ניהול לידים חכם',
                  desc: 'מעקב, תזכורות ודו"ח ביצועים שבועי',
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

          {/* Bottom: social proof */}
          <div className="relative">
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
              }}
            >
              <p className="text-sm text-white/70 leading-relaxed mb-3">
                &quot;PropBuilder חסך לנו שעות עבודה בכל נכס. עכשיו כל לידים נכנסים ישר לדאשבורד.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #d4a853, #b8892e)' }}
                >
                  ד
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">דני כהן</p>
                  <p className="text-white/40 text-xs">מנהל סוכנות, תל אביב</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Form panel (right on desktop, full on mobile) ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gray-50 min-h-screen md:min-h-0" dir="rtl">
          {/* Logo shown only on mobile (branding panel hidden) */}
          <div className="mb-8 md:hidden">
            <Link href="/" className="text-2xl font-bold text-gray-900">PropBuilder</Link>
          </div>

          <div className="w-full max-w-sm">
            <LoginContent searchParams={searchParams} />
          </div>

          <p className="mt-8 text-xs text-gray-400 text-center">
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">

      {registered && (
        <div className="bg-green-50 text-green-700 text-sm rounded-xl px-4 py-3 border border-green-200">
          החשבון נוצר בהצלחה! התחבר כדי להתחיל.
        </div>
      )}

      {reset && (
        <div className="bg-green-50 text-green-700 text-sm rounded-xl px-4 py-3 border border-green-200">
          הסיסמה עודכנה בהצלחה! התחבר עם הסיסמה החדשה.
        </div>
      )}

      {upgraded && (
        <div className="bg-green-50 text-green-700 text-sm rounded-xl px-4 py-3 border border-green-200">
          השדרוג הצליח! התחבר מחדש כדי להפעיל את הגישה המקצועית.
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-200">
          {error === 'OAuthSignin' || error === 'CredentialsSignin'
            ? 'מייל או סיסמה שגויים'
            : 'שגיאה בכניסה. נסה שוב.'}
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 text-sm font-medium">
        <Link
          href={`/auth/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
          className={`flex-1 py-2.5 text-center transition-colors ${!isCommercial ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          מוכר פרטי
        </Link>
        <Link
          href={`/auth/login?mode=commercial${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
          className={`flex-1 py-2.5 text-center transition-colors ${isCommercial ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          סוכן / מתווך
        </Link>
      </div>

      {!isCommercial ? (
        /* Personal: Google sign-in */
        <div className="space-y-4">
          <p className="text-sm text-gray-500 text-center">
            התחבר עם Google כדי לשמור ולנהל את הנכסים שלך
          </p>
          <GoogleSignInButton callbackUrl={callbackUrl ?? '/personal'} />
          <p className="text-center text-xs text-gray-400">
            עדיין אין לך חשבון? הכניסה יוצרת אחד אוטומטית
          </p>
        </div>
      ) : (
        /* Commercial: Google + credentials */
        <div className="space-y-5">
          <GoogleSignInButton
            callbackUrl={callbackUrl ?? '/dashboard'}
            label="כניסה עם Google"
          />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">או עם מייל וסיסמה</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form action={loginAction} className="space-y-5">
            <input type="hidden" name="callbackUrl" value={callbackUrl ?? '/dashboard'} />

            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">כתובת מייל</label>
              <input
                id="email" name="email" type="email" autoComplete="email" required dir="ltr"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="agent@agency.co.il"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">סיסמה</label>
              <input
                id="password" name="password" type="password" autoComplete="current-password" required dir="ltr"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
              כניסה
            </button>

            <p className="text-center text-xs text-gray-400">
              שכחת סיסמה?{' '}
              <Link href="/auth/forgot-password" className="text-blue-600 hover:underline">איפוס סיסמה</Link>
            </p>
            <p className="text-center text-xs text-gray-400">
              אין לך חשבון?{' '}
              <Link href="/auth/register" className="text-blue-600 hover:underline">הרשמה חינם</Link>
            </p>
          </form>
        </div>
      )}
    </div>
  )
}
