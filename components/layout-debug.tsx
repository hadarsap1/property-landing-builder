'use client'

import { useEffect, useState } from 'react'

interface Report {
  scrollHeight: number
  bodyHeight: number
  innerHeight: number
  visualViewport: number
  footerBottom: number
  gap: number
  bottomMost: string[]
}

/**
 * Temporary on-device layout diagnostic — renders only with ?debug=1.
 * Shows what extends the document below the footer (iOS-only phantom
 * space reported below the home page footer).
 */
export default function LayoutDebug() {
  const [report, setReport] = useState<Report | null>(null)

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('debug')) return

    function measure() {
      const footer = document.querySelector('footer')
      const footerBottom = footer
        ? Math.round(footer.getBoundingClientRect().bottom + window.scrollY)
        : -1
      const items: { bottom: number; label: string }[] = []
      document.querySelectorAll('body *').forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.height < 2 && r.width < 2) return
        const bottom = Math.round(r.top + window.scrollY + r.height)
        const cls = (el.className || '').toString().slice(0, 40)
        items.push({ bottom, label: `${el.tagName}.${cls} h=${Math.round(r.height)} btm=${bottom}` })
      })
      items.sort((a, b) => b.bottom - a.bottom)
      setReport({
        scrollHeight: document.documentElement.scrollHeight,
        bodyHeight: document.body.scrollHeight,
        innerHeight: window.innerHeight,
        visualViewport: Math.round(window.visualViewport?.height ?? 0),
        footerBottom,
        gap: document.documentElement.scrollHeight - footerBottom,
        bottomMost: items.slice(0, 6).map((i) => i.label),
      })
    }

    // Measure after load settles, and again on resize/scroll end
    const t = setTimeout(measure, 1500)
    window.addEventListener('resize', measure)
    return () => { clearTimeout(t); window.removeEventListener('resize', measure) }
  }, [])

  if (!report) return null

  return (
    <div
      dir="ltr"
      style={{
        position: 'fixed', top: 70, left: 8, right: 8, zIndex: 99999,
        background: 'rgba(0,0,0,0.85)', color: '#4ade80',
        font: '10px/1.5 monospace', padding: 10, borderRadius: 8,
        whiteSpace: 'pre-wrap', wordBreak: 'break-all', pointerEvents: 'none',
      }}
    >
      {`docH=${report.scrollHeight} bodyH=${report.bodyHeight}
innerH=${report.innerHeight} visualVP=${report.visualViewport}
footerBtm=${report.footerBottom} GAP=${report.gap}
--- bottom-most elements ---
${report.bottomMost.join('\n')}`}
    </div>
  )
}
