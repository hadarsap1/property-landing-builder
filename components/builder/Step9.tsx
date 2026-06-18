'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { PropertyProject } from '@/types/project'

interface StepProps {
  project: PropertyProject
  listingUrl?: string | null
  isLoggedIn?: boolean
}

export default function Step9({ project, listingUrl, isLoggedIn = false }: StepProps) {
  const [kvCode, setKvCode] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [codeTooltipOpen, setCodeTooltipOpen] = useState(false)
  const [confirmNew, setConfirmNew] = useState(false)

  useEffect(() => {
    const sessionId = sessionStorage.getItem('sessionId') ?? ''
    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'project_completed', sessionId }),
    })
  }, [])

  async function saveToKv() {
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/save-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      })
      if (!res.ok) {
        const d = (await res.json()) as { error?: string }
        throw new Error(d.error ?? 'שגיאה בשמירה')
      }
      const { code } = (await res.json()) as { code: string }
      setKvCode(code)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה לא צפויה')
    } finally {
      setSaving(false)
    }
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (listingUrl) {
    const fullUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${listingUrl}`
      : listingUrl

    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-bold" style={{ color: '#111' }}>סיום</h2>

        <div className="rounded-lg p-6 space-y-4" style={{ background: '#f7f5f2', border: '2px solid #111' }}>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: '#111' }}>דף הנחיתה שלך מוכן</h3>
            <p className="text-sm mt-0.5" style={{ color: '#888' }}>הנכס נשמר בענן ומתעדכן אוטומטית בכל שינוי</p>
          </div>

          <div className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ background: '#fff', border: '1px solid #ccc' }}>
            <p className="flex-1 text-sm font-mono truncate" dir="ltr" style={{ color: '#555' }}>{fullUrl}</p>
            <button
              type="button"
              onClick={() => void copyText(fullUrl)}
              className="shrink-0 text-sm font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
              style={{ background: '#f7f5f2', color: '#111', border: '1px solid #ccc' }}
            >
              {copied ? '✓ הועתק' : 'העתק'}
            </button>
          </div>

          <Link
            href={listingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full font-semibold py-3 rounded-lg transition-opacity hover:opacity-85 text-white"
            style={{ background: '#c0392b' }}
          >
            פתח את דף הנחיתה
          </Link>

          <div className="flex gap-2">
            <a
              href={`mailto:?subject=${encodeURIComponent(project.aiTitle || project.title || 'נכס למכירה')}&body=${encodeURIComponent(`שלום,\nמצורף קישור לדף הנחיתה:\n${fullUrl}`)}`}
              className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 rounded-lg transition-opacity hover:opacity-70"
              style={{ border: '1px solid #ddd', color: '#555' }}
            >
              מייל
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`🏠 ${project.aiTitle || project.title || 'נכס למכירה'}\nלצפייה בדף הנחיתה: ${fullUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 rounded-lg transition-opacity hover:opacity-85 text-white"
              style={{ background: '#25D366' }}
            >
              WhatsApp
            </a>
          </div>
        </div>

        <div className="rounded-lg p-5" style={{ border: '2px solid #111' }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold" style={{ color: '#111' }}>תצוגה מקדימה מקומית</h3>
              <p className="text-sm mt-0.5" style={{ color: '#888' }}>בדוק את הדף לפני פרסום</p>
            </div>
            <Link
              href="/preview/local"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-semibold px-5 py-2.5 rounded-lg transition-opacity hover:opacity-85 text-sm text-white"
              style={{ background: '#111' }}
            >
              פתח תצוגה מקדימה
            </Link>
          </div>
        </div>

        {!isLoggedIn && <LoginPrompt />}
        <Summary project={project} />
      </div>
    )
  }

  const fullKvUrl = kvCode && typeof window !== 'undefined' ? `${window.location.origin}/preview/${kvCode}` : ''

  return (
    <div className="space-y-6">

      <div className="text-center py-4">
        <h2 className="text-2xl font-bold mb-1" style={{ color: '#111' }}>הדף שלך מוכן!</h2>
        <p className="text-sm" style={{ color: '#888' }}>
          {project.aiTitle || project.title || 'הנכס שלך'} נראה מדהים
        </p>
      </div>

      <div className="rounded-lg p-5" style={{ background: '#f7f5f2', border: '2px solid #111' }}>
        <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide" style={{ color: '#111' }}>
          מה עכשיו?
        </h3>
        <ol className="space-y-3">
          {[
            { n: '1', title: 'שמור וקבל קישור', desc: 'לחץ על "שמור וקבל קישור" למטה, ותקבל קוד 6 ספרות וקישור ישיר' },
            { n: '2', title: 'שתף ב-WhatsApp / מייל', desc: 'שלח את הקישור לקונים פוטנציאליים, לסוכנים, לקבוצות' },
            { n: '3', title: 'רוצה לשנות משהו?', desc: 'חזור לכל שלב דרך הניווט למעלה. השינויים יישמרו אוטומטית בטיוטה' },
          ].map(({ n, title, desc }) => (
            <li key={n} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center mt-0.5" style={{ background: '#111' }}>{n}</span>
              <div>
                <p className="font-medium text-sm" style={{ color: '#111' }}>{title}</p>
                <p className="text-xs" style={{ color: '#888' }}>{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-lg p-4 flex items-center justify-between gap-3" style={{ border: '2px solid #111' }}>
        <div>
          <p className="font-medium text-sm" style={{ color: '#111' }}>תצוגה מקדימה מקומית</p>
          <p className="text-xs mt-0.5" style={{ color: '#888' }}>ראה את הדף לפני השמירה</p>
        </div>
        <Link
          href="/preview/local"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 flex items-center gap-1.5 font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-85 text-sm text-white"
          style={{ background: '#111' }}
        >
          תצוגה מקדימה
        </Link>
      </div>

      <div className="rounded-lg p-6" style={{ background: '#f7f5f2', border: '2px solid #111' }}>
        {kvCode ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg px-4 py-3" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}>
              <span className="text-lg">✅</span>
              <span className="font-semibold text-sm">הדף נשמר בהצלחה! הקישור שלך מוכן.</span>
            </div>

            <Link
              href={`/preview/${kvCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full font-bold py-3.5 rounded-lg transition-opacity hover:opacity-85 text-base text-white"
              style={{ background: '#c0392b' }}
            >
              פתח את דף הנחיתה שלך
            </Link>

            <div className="flex items-center gap-2 rounded-lg px-4 py-3" style={{ background: '#fff', border: '1px solid #ccc' }}>
              <p className="flex-1 text-sm truncate font-mono" style={{ color: '#888' }}>{fullKvUrl}</p>
              <button
                type="button"
                onClick={() => void copyText(fullKvUrl)}
                className="flex-shrink-0 flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
                style={{ background: '#f7f5f2', color: '#111', border: '1px solid #ccc' }}
              >
                {copied ? '✓ הועתק' : 'העתק'}
              </button>
            </div>

            <div className="rounded-lg px-4 py-3 space-y-2" style={{ background: '#fff', border: '1px solid #ccc' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="text-xs" style={{ color: '#888' }}>קוד גישה</div>
                  <div className="group relative inline-block">
                    <button
                      type="button"
                      className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors"
                      style={{ background: '#e5e5e5', color: '#555' }}
                      aria-label="מה זה קוד גישה?"
                      aria-expanded={codeTooltipOpen}
                      onClick={() => setCodeTooltipOpen((p) => !p)}
                    >
                      ?
                    </button>
                    {codeTooltipOpen && (
                      <div className="fixed inset-0 z-10" onClick={() => setCodeTooltipOpen(false)} />
                    )}
                    <div className={`absolute bottom-full right-0 mb-1.5 w-56 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 leading-relaxed z-20 transition-opacity pointer-events-none ${codeTooltipOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      אם תאבדו את הקישור — הזינו קוד זה בדף הבית כדי לחזור לדף הנכס שלכם
                      <div className="absolute top-full right-3 border-4 border-transparent border-t-gray-900" />
                    </div>
                  </div>
                </div>
                <div className="text-xs" style={{ color: '#888' }}>תוקף: 90 יום</div>
              </div>
              <div className="text-2xl font-bold tracking-widest" style={{ color: '#c0392b' }}>{kvCode}</div>
            </div>

            <div className="flex gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`🏠 ${project.aiTitle || project.title || 'נכס למכירה'}\nלצפייה בדף הנחיתה: ${fullKvUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 rounded-lg transition-opacity hover:opacity-85 text-white"
                style={{ background: '#25D366' }}
              >
                WhatsApp
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(project.aiTitle || project.title || 'נכס למכירה')}&body=${encodeURIComponent(`שלום,\nמצורף קישור לדף הנחיתה:\n${fullKvUrl}`)}`}
                className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 rounded-lg transition-opacity hover:opacity-70"
                style={{ border: '1px solid #ddd', color: '#555' }}
              >
                מייל
              </a>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-base font-semibold mb-1" style={{ color: '#111' }}>שמור ושתף</h3>
            <p className="text-sm mb-4" style={{ color: '#888' }}>
              שמירה תיצור קישור ייחודי שתוכל לשלוח לכל אחד. תוקף: 90 יום.
            </p>
            {error && (
              <p className="text-sm mb-3 rounded-lg p-3" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>{error}</p>
            )}
            <button
              type="button"
              onClick={() => void saveToKv()}
              disabled={saving}
              className="w-full px-6 py-3.5 rounded-lg font-bold transition-opacity hover:opacity-85 flex items-center justify-center gap-2 text-base text-white disabled:opacity-50"
              style={{ background: '#111' }}
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  שומר...
                </>
              ) : 'שמור וקבל קישור לשיתוף'}
            </button>
          </div>
        )}
      </div>

      {!isLoggedIn && <LoginPrompt />}

      <details className="group rounded-lg" style={{ background: '#f7f5f2', border: '1px solid #ccc' }}>
        <summary className="px-4 py-3 text-sm font-semibold cursor-pointer list-none flex items-center justify-between" style={{ color: '#555' }}>
          סיכום הנכס
          <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#aaa' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="px-4 pb-4">
          <dl className="grid grid-cols-2 gap-2 text-sm pt-2" style={{ borderTop: '1px solid #ddd' }}>
            {project.title && (<><dt style={{ color: '#888' }}>כותרת</dt><dd className="font-medium" style={{ color: '#111' }}>{project.aiTitle || project.title}</dd></>)}
            {project.city && (<><dt style={{ color: '#888' }}>מיקום</dt><dd style={{ color: '#111' }}>{[project.street, project.city].filter(Boolean).join(', ')}</dd></>)}
            {project.rooms && (<><dt style={{ color: '#888' }}>חדרים</dt><dd style={{ color: '#111' }}>{project.rooms}</dd></>)}
            {project.builtArea && (<><dt style={{ color: '#888' }}>שטח</dt><dd style={{ color: '#111' }}>{project.builtArea} מ״ר</dd></>)}
            {project.images.length > 0 && (<><dt style={{ color: '#888' }}>תמונות</dt><dd style={{ color: '#111' }}>{project.images.length}</dd></>)}
            <dt style={{ color: '#888' }}>תבנית</dt>
            <dd style={{ color: '#111' }}>{project.template}</dd>
          </dl>
        </div>
      </details>

      <div className="text-center pt-2 pb-1">
        {!confirmNew ? (
          <button
            type="button"
            onClick={() => setConfirmNew(true)}
            className="text-sm underline underline-offset-2 transition-opacity hover:opacity-60"
            style={{ color: '#aaa' }}
          >
            + התחל נכס חדש
          </button>
        ) : (
          <div className="rounded-lg px-4 py-3 text-sm space-y-3" style={{ background: '#f7f5f2', border: '2px solid #111' }}>
            <p className="font-medium" style={{ color: '#111' }}>הטיוטה הנוכחית תימחק. להמשיך?</p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('property-builder-draft');
                  window.location.reload();
                }}
                className="text-xs font-semibold px-4 py-1.5 rounded-lg transition-opacity hover:opacity-85 text-white"
                style={{ background: '#c0392b' }}
              >
                כן, מחק והתחל מחדש
              </button>
              <button
                type="button"
                onClick={() => setConfirmNew(false)}
                className="text-xs font-semibold px-4 py-1.5 rounded-lg transition-opacity hover:opacity-70"
                style={{ border: '1px solid #ddd', color: '#555' }}
              >
                ביטול
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

const TEMPLATE_NAMES: Record<PropertyProject['template'], string> = {
  'modern-blue': 'כחול מודרני',
  'dark-luxury': 'יוקרה כהה',
  'warm-homey': 'חמים וביתי',
  'nature-space': 'טבע ומרחב',
  'urban-bold': 'אורבני נועז',
}

function LoginPrompt() {
  const callbackUrl = typeof window !== 'undefined'
    ? window.location.pathname + window.location.search
    : '/builder'
  const loginUrl = `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`

  return (
    <div className="rounded-lg p-5" style={{ background: '#f7f5f2', border: '2px solid #111' }}>
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">🔐</span>
        <div>
          <h3 className="font-semibold mb-1" style={{ color: '#111' }}>שמור את הנכס לתמיד</h3>
          <p className="text-sm mb-4" style={{ color: '#888' }}>
            הרשמה חינמית מאפשרת לערוך את הנכס בכל עת, לקבל סטטיסטיקות על צפיות וליצור דפים נוספים.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={loginUrl}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-85 text-white"
              style={{ background: '#111' }}
            >
              כניסה עם Google
            </a>
            <a
              href={`/auth/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-70"
              style={{ border: '2px solid #111', color: '#111' }}
            >
              הרשמה
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function Summary({ project }: { project: PropertyProject }) {
  return (
    <div className="rounded-lg p-4" style={{ background: '#f7f5f2', border: '1px solid #ccc' }}>
      <h4 className="text-sm font-semibold mb-3" style={{ color: '#555' }}>סיכום הנכס</h4>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        {project.title && (<><dt style={{ color: '#888' }}>כותרת</dt><dd className="font-medium" style={{ color: '#111' }}>{project.aiTitle || project.title}</dd></>)}
        {project.city && (<><dt style={{ color: '#888' }}>מיקום</dt><dd style={{ color: '#111' }}>{[project.street, project.city].filter(Boolean).join(', ')}</dd></>)}
        {project.rooms && (<><dt style={{ color: '#888' }}>חדרים</dt><dd style={{ color: '#111' }}>{project.rooms}</dd></>)}
        {project.builtArea && (<><dt style={{ color: '#888' }}>שטח</dt><dd style={{ color: '#111' }}>{project.builtArea} מ״ר</dd></>)}
        {project.images.length > 0 && (<><dt style={{ color: '#888' }}>תמונות</dt><dd style={{ color: '#111' }}>{project.images.length}</dd></>)}
        <dt style={{ color: '#888' }}>תבנית</dt>
        <dd style={{ color: '#111' }}>{TEMPLATE_NAMES[project.template] ?? project.template}</dd>
      </dl>
    </div>
  )
}
