import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4" dir="rtl">
      <div className="text-center max-w-sm">
        <div className="text-5xl font-bold text-gray-200 mb-4">404</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">הדף לא נמצא</h1>
        <p className="text-gray-500 mb-6">הקישור שגוי או שהדף הוסר.</p>
        <Link
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          חזור לדף הבית
        </Link>
      </div>
    </main>
  )
}
