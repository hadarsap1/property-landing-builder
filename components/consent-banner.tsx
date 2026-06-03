'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const CONSENT_KEY = 'pb-cookie-consent'

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) setVisible(true)
    } catch {
      // localStorage unavailable (SSR / private mode)
    }
  }, [])

  function accept() {
    try { localStorage.setItem(CONSENT_KEY, 'accepted') } catch { /* ignore */ }
    try {
      const maxAge = 60 * 60 * 24 * 365 // 1 year
      document.cookie = `${CONSENT_KEY}=accepted; max-age=${maxAge}; SameSite=Lax; Secure; path=/`
    } catch { /* ignore */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="הסכמה לשימוש בעוגיות"
      dir="rtl"
      className="fixed bottom-0 right-0 left-0 z-[100] bg-gray-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xl text-sm"
    >
      <p className="flex-1 min-w-0">
        אנו משתמשים בעוגיות הכרחיות לאימות ובניתוח תנועה אנונימי.{' '}
        <Link href="/privacy" className="underline hover:text-blue-300">
          מדיניות פרטיות
        </Link>
      </p>
      <button
        type="button"
        onClick={accept}
        className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
      >
        הבנתי
      </button>
    </div>
  )
}
