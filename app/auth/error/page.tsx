import Link from 'next/link'
import { sql } from '@/lib/db'
import { getAuthErrors } from '@/lib/auth-error-log'

const MESSAGES: Record<string, string> = {
  Configuration: 'שגיאת הגדרות שרת. פנה למנהל.',
  AccessDenied: 'אין לך הרשאה לכניסה.',
  Verification: 'קישור הכניסה פג תוקף. בקש קישור חדש.',
  PersonalUserSetupFailed: 'הכניסה הצליחה אך לא ניתן ליצור את החשבון שלך במערכת. נסה שוב או פנה לתמיכה.',
  Default: 'שגיאה בכניסה. נסה שוב.',
}

export const dynamic = 'force-dynamic'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const errorParam = typeof params.error === 'string' ? params.error : 'Default'
  const message = MESSAGES[errorParam] ?? MESSAGES.Default

  // Collect error details from both DB (cross-lambda) and in-memory buffer (same lambda)
  const dbRows = await sql`
    SELECT ts, data FROM auth_debug_log ORDER BY ts DESC LIMIT 5
  `.then(r => r.rows as { ts: string; data: string }[]).catch(() => [] as { ts: string; data: string }[])

  const fromDb = dbRows.map(r => {
    try { return { ts: r.ts, src: 'db', ...JSON.parse(r.data) } }
    catch { return { ts: r.ts, src: 'db', raw: r.data } }
  })

  const fromMem = getAuthErrors().slice(-3).map(e => ({ ...e, src: 'mem' }))

  const allErrors = [...fromDb, ...fromMem]
    .sort((a, b) => new Date(String(b.ts)).getTime() - new Date(String(a.ts)).getTime())
    .slice(0, 5)

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12" dir="rtl">
      <div className="text-center max-w-3xl w-full">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">שגיאה בכניסה</h1>
        <p className="text-gray-600 mb-6">{message}</p>

        <div className="bg-gray-100 text-left p-4 rounded-xl mb-4 text-xs font-mono overflow-auto" dir="ltr">
          <div className="font-bold mb-2 text-gray-800">URL params:</div>
          <pre className="whitespace-pre-wrap break-all text-gray-700">
{JSON.stringify(params, null, 2)}
          </pre>
        </div>

        {allErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-left p-4 rounded-xl mb-6 text-xs font-mono overflow-auto" dir="ltr">
            <div className="font-bold mb-2 text-red-800">Recent auth errors ({allErrors.length}):</div>
            {allErrors.map((err, i) => (
              <div key={i} className="mb-3 border-t border-red-200 pt-2">
                <pre className="whitespace-pre-wrap break-all text-red-700">
{JSON.stringify(err, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}

        <Link
          href="/auth/login"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          חזור לכניסה
        </Link>
      </div>
    </main>
  )
}
