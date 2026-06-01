import Link from 'next/link'

const MESSAGES: Record<string, string> = {
  Configuration: 'שגיאת הגדרות שרת. פנה למנהל.',
  AccessDenied: 'אין לך הרשאה לכניסה.',
  Verification: 'קישור הכניסה פג תוקף. בקש קישור חדש.',
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

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12" dir="rtl">
      <div className="text-center max-w-2xl w-full">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">שגיאה בכניסה</h1>
        <p className="text-gray-600 mb-6">{message}</p>

        <div className="bg-gray-100 text-left p-4 rounded-xl mb-6 text-xs font-mono overflow-auto" dir="ltr">
          <div className="font-bold mb-2 text-gray-800">Diagnostic info:</div>
          <pre className="whitespace-pre-wrap break-all text-gray-700">
{JSON.stringify(params, null, 2)}
          </pre>
        </div>

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
