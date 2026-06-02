import Link from 'next/link'
import { loginAction } from './actions'
import { GoogleSignInButton } from '../_google-button'

type SP = { callbackUrl?: string; error?: string; mode?: string; upgraded?: string; registered?: string }

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SP>
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gray-900">PropBuilder</Link>
        </div>
        <LoginContent searchParams={searchParams} />
      </div>
    </main>
  )
}

async function LoginContent({ searchParams }: { searchParams: Promise<SP> }) {
  const { callbackUrl, error, mode, upgraded, registered } = await searchParams
  const isCommercial = mode === 'commercial'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">

      {registered && (
        <div className="bg-green-50 text-green-700 text-sm rounded-xl px-4 py-3 border border-green-200">
          החשבון נוצר בהצלחה! התחבר כדי להתחיל.
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

            <p className="text-center text-xs text-gray-400">שכחת סיסמה? פנה למנהל הסוכנות.</p>
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
