'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const CONSENT_KEY = 'pb-cookie-consent'

/**
 * Height of this banner, published to the rest of the app as a CSS variable.
 * Anything anchored to the bottom of the viewport (the builder's next/back
 * nav, the listing page's call & WhatsApp bar, the share bar) offsets itself
 * by it — otherwise this banner sits on top of them and swallows the taps,
 * which on a phone left first-time visitors unable to advance the wizard.
 */
const OFFSET_VAR = '--consent-h'

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) setVisible(true)
    } catch {
      // localStorage unavailable (SSR / private mode)
    }
  }, [])

  useEffect(() => {
    const el = barRef.current
    const root = document.documentElement
    if (!visible || !el) {
      root.style.setProperty(OFFSET_VAR, '0px')
      return
    }
    // Text wraps to two lines on narrow screens, so measure rather than guess.
    const publish = () => root.style.setProperty(OFFSET_VAR, `${el.offsetHeight}px`)
    publish()
    const ro = new ResizeObserver(publish)
    ro.observe(el)
    return () => {
      ro.disconnect()
      root.style.setProperty(OFFSET_VAR, '0px')
    }
  }, [visible])

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
      ref={barRef}
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
