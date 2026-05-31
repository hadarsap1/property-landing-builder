import Link from 'next/link'

const MESSAGES: Record<string, string> = {
  Configuration: 'שגיאת הגדרות שרת. פנה למנהל.',
  AccessDenied: 'אין לך הרשאה לכניסה.',
  Verification: 'קישור הכניסה פג תוקף. בקש קישור חדש.',
  Default: 'שגיאה בכניסה. נסה שוב.',
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const message = MESSAGES[error ?? 'Default'] ?? MESSAGES.Default

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4" dir="rtl">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">שגיאה בכניסה</h1>
        <p className="text-gray-600 mb-6">{message}</p>
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
