import { notFound } from 'next/navigation'
import { getAgentByInviteToken } from '@/lib/db/queries/agents'
import { setPasswordAction } from './actions'

const ERROR_MESSAGES: Record<string, string> = {
  short: 'הסיסמה חייבת להכיל לפחות 8 תווים',
  mismatch: 'הסיסמאות אינן תואמות',
  expired: 'קישור ההזמנה פג תוקף. בקש הזמנה חדשה מהמנהל.',
}

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>
}) {
  const { token, error } = await searchParams
  if (!token) notFound()

  const agent = await getAgentByInviteToken(token)
  if (!agent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4" dir="rtl">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⏰</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">קישור לא תקף</h1>
          <p className="text-gray-600">קישור ההזמנה פג תוקף או כבר נוצל. בקש מהמנהל לשלוח הזמנה חדשה.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl mb-3">👋</div>
          <h1 className="text-2xl font-bold text-gray-900">ברוך הבא, {agent.name}</h1>
          <p className="text-sm text-gray-500 mt-1">הגדר סיסמה להמשיך</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 border border-red-200 mb-5">
              {ERROR_MESSAGES[error] ?? 'אירעה שגיאה. נסה שוב.'}
            </div>
          )}

          <form action={setPasswordAction} className="space-y-5">
            <input type="hidden" name="token" value={token} />

            <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600">
              כניסה בתור: <span className="font-medium">{agent.email}</span>
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                סיסמה חדשה
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="מינימום 8 תווים"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="confirm" className="text-sm font-medium text-gray-700">
                אימות סיסמה
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              הגדר סיסמה וכנס
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
