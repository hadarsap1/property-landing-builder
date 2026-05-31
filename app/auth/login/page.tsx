import { loginAction } from './actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">כניסה לדשבורד</h1>
          <p className="text-sm text-gray-500 mt-1">נציגי נדל״ן בלבד</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <LoginForm searchParams={searchParams} />
        </div>
      </div>
    </main>
  )
}

async function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  const { callbackUrl, error } = await searchParams

  return (
    <form action={loginAction} className="space-y-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? '/dashboard'} />

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 border border-red-200">
          {error === 'OAuthSignin' || error === 'CredentialsSignin'
            ? 'מייל או סיסמה שגויים'
            : 'שגיאה בכניסה. נסה שוב.'}
        </div>
      )}

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
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
      >
        כניסה
      </button>
    </form>
  )
}
