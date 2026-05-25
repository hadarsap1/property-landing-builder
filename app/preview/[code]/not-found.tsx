import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      dir="rtl"
      lang="he"
      className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center"
    >
      <div className="text-6xl mb-6">🏚️</div>
      <h1 className="text-3xl font-bold text-gray-800 mb-3">הנכס לא נמצא</h1>
      <p className="text-gray-500 mb-2 max-w-sm">
        הקוד שהזנת אינו תקין, או שהנכס פג תוקף (90 יום).
      </p>
      <p className="text-gray-400 text-sm mb-8">
        בדוק שהקוד נכון ונסה שוב.
      </p>
      <Link
        href="/builder"
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        צור נכס חדש
      </Link>
    </div>
  );
}
