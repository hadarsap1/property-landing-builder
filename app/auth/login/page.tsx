import Link from 'next/link'
import { loginAction, googleSignInAction } from './actions'

type SP = { callbackUrl?: string; error?: string; mode?: string; upgraded?: string }

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
  const { callbackUrl, error, mode, upgraded } = await searchParams
  const isCommercial = mode === 'commercial'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">

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
          <form action={googleSignInAction}>
            <input type="hidden" name="callbackUrl" value={callbackUrl ?? '/personal'} />
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              כניסה עם Google
            </button>
          </form>
          <p className="text-center text-xs text-gray-400">
            עדיין אין לך חשבון? הכניסה יוצרת אחד אוטומטית
          </p>
        </div>
      ) : (
        /* Commercial: credentials */
        <form action={loginAction} className="space-y-5">
          <input type="hidden" name="callbackUrl" value={callbackUrl ?? '/dashboard'} />

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              כתובת מייל
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="agent@agency.co.il"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              סיסמה
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            כניסה
          </button>

          <p className="text-center text-xs text-gray-400">
            שכחת סיסמה? פנה למנהל הסוכנות.
          </p>
        </form>
      )}
    </div>
  )
}
