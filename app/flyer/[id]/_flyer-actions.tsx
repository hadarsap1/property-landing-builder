'use client'

export default function FlyerActions() {
  return (
    <div className="print:hidden flex items-center justify-center gap-3 mb-5" dir="rtl">
      <button
        type="button"
        onClick={() => window.print()}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
      >
        🖨️ הדפס / שמור כ-PDF
      </button>
      <button
        type="button"
        onClick={() => window.history.back()}
        className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
      >
        ← חזרה
      </button>
    </div>
  )
}
