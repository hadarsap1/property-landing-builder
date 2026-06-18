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
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f7f5f2' }} dir="rtl">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⏰</div>
          <h1 className="text-xl font-bold mb-2" style={{ color: '#111' }}>קישור לא תקף</h1>
          <p style={{ color: '#888' }}>קישור ההזמנה פג תוקף או כבר נוצל. בקש מהמנהל לשלוח הזמנה חדשה.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f7f5f2' }} dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl mb-3">👋</div>
          <h1 className="text-2xl font-bold" style={{ color: '#111' }}>ברוך הבא, {agent.name}</h1>
          <p className="text-sm mt-1" style={{ color: '#888' }}>הגדר סיסמה להמשיך</p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: '#fff', border: '2px solid #111' }}>
          {error && (
            <div className="text-sm rounded-lg px-4 py-3 mb-5" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
              {ERROR_MESSAGES[error] ?? 'אירעה שגיאה. נסה שוב.'}
            </div>
          )}

          <form action={setPasswordAction} className="space-y-5">
            <input type="hidden" name="token" value={token} />

            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#f7f5f2', color: '#888' }}>
              כניסה בתור: <span className="font-medium" style={{ color: '#111' }}>{agent.email}</span>
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium" style={{ color: '#111' }}>
                סיסמה חדשה
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                style={{ border: '2px solid #111', background: '#f7f5f2' }}
                placeholder="מינימום 8 תווים"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="confirm" className="text-sm font-medium" style={{ color: '#111' }}>
                אימות סיסמה
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                style={{ border: '2px solid #111', background: '#f7f5f2' }}
              />
            </div>

            <button
              type="submit"
              className="w-full font-semibold py-2.5 rounded-xl transition-colors text-sm"
              style={{ background: '#c0392b', color: '#fff' }}
            >
              הגדר סיסמה וכנס
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
