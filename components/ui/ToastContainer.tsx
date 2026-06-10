'use client'

import { useToasts } from './toast'

export default function ToastContainer() {
  const toasts = useToasts()
  if (!toasts.length) return null

  return (
    <div
      className="fixed top-4 inset-x-0 flex flex-col items-center gap-2 z-[9999] pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`pointer-events-auto px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
            t.type === 'success'
              ? 'bg-green-600 text-white'
              : t.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-gray-800 text-white'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
