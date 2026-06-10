'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { PropertyProject } from '@/types/project'
import { projectToListingData } from '@/lib/listings/adapt'
import Step1 from '@/components/builder/Step1'
import Step2 from '@/components/builder/Step2'
import Step3 from '@/components/builder/Step3'
import Step4 from '@/components/builder/Step4'
import Step5 from '@/components/builder/Step5'
import Step6 from '@/components/builder/Step6'
import Step7 from '@/components/builder/Step7'
import Step8 from '@/components/builder/Step8'
import Step9 from '@/components/builder/Step9'
import ImportListing from '@/components/builder/ImportListing'

interface BuilderClientProps {
  agencyId: string
  agencySlug: string
  personalUserId: string
  listingId: string | null
  listingSlug: string | null
  initialProject: PropertyProject | null
}

const STEP_NAMES: Record<number, string> = {
  1: 'פרטי הנכס',
  2: 'מפרט',
  3: 'הסיפור',
  4: 'תמונות',
  5: 'מיקום',
  6: 'תבנית',
  7: 'עיצוב',
  8: 'יצירת קשר',
  9: 'סיום',
}

const TOTAL_STEPS = 9

const DEFAULT_PROJECT: PropertyProject = {
  listingType: 'sale',
  title: '',
  street: '',
  city: '',
  neighborhood: '',
  price: null,
  priceOnRequest: false,
  furniture: '',
  builtArea: null,
  gardenArea: null,
  rooms: null,
  floor: null,
  totalFloors: null,
  parkingSpots: null,
  parkingType: '',
  hasStorage: false,
  hasSaferoom: false,
  hasElevator: false,
  airDirections: [],
  buildYear: null,
  renovationYear: null,
  bathrooms: null,
  rawStory: '',
  aiTitle: '',
  aiTagline: '',
  aiStory: '',
  aiHighlights: [],
  images: [],
  heroImageIndex: 0,
  galleryType: 'grid',
  videoUrl: '',
  showMap: true,
  mapQuery: '',
  template: 'modern-blue',
  accentColor: '#2563eb',
  fontStyle: 'sans-serif',
  sectionOrder: ['hero', 'story', 'specs', 'gallery', 'map', 'contact'],
  sectionVisibility: { hero: true, story: true, specs: true, gallery: true, map: true, contact: true },
  specIcons: {
    rooms: '🏠',
    builtArea: '📐',
    gardenArea: '🌿',
    floor: '🏢',
    bathrooms: '🛁',
    parking: '🚗',
    storage: '📦',
    saferoom: '🛡️',
    elevator: '🛗',
    buildYear: '📅',
    renovationYear: '🔨',
    airDirections: '🧭',
  },
  sellerName: '',
  phone: '',
  whatsapp: '',
}

type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

function track(event: string, step?: number) {
  const sessionId = sessionStorage.getItem('sessionId') ?? ''
  void fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, sessionId, step }),
  })
}

export default function BuilderClient({
  agencyId,
  agencySlug,
  personalUserId,
  listingId: initialListingId,
  listingSlug: initialListingSlug,
  initialProject,
}: BuilderClientProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [project, setProject] = useState<PropertyProject>(
    initialProject ?? DEFAULT_PROJECT
  )
  const [hydrated, setHydrated] = useState(false)
  const [listingId, setListingId] = useState<string | null>(initialListingId)
  const [listingSlug, setListingSlug] = useState<string | null>(initialListingSlug)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activePillRef = useRef<HTMLButtonElement>(null)

  // ── Init ────────────────────────────────────────────────────────────────

  // Scroll active pill into view on step change
  useEffect(() => {
    activePillRef.current?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [step])

  useEffect(() => {
    if (!sessionStorage.getItem('sessionId')) {
      sessionStorage.setItem('sessionId', `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    }
  }, [])

  useEffect(() => {
    // If server gave us a listing, start at step 1
    if (initialProject) {
      setStep(initialProject.title || initialProject.street ? 1 : 0)
      setHydrated(true)
      track('wizard_started')
      return
    }

    // Otherwise load from localStorage (legacy/unauthenticated flow)
    const saved = localStorage.getItem('property-builder-draft')
    const savedStep = localStorage.getItem('property-builder-step')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as PropertyProject
        setProject(parsed)
        if (savedStep && Number(savedStep) >= 1) {
          setStep(Number(savedStep))
        } else if (parsed.title || parsed.street || parsed.city) {
          setStep(1)
        }
        if (!parsed.mapQuery && (parsed.street || parsed.city)) {
          setProject((p) => ({ ...p, mapQuery: `${parsed.street}, ${parsed.city}, ישראל` }))
        }
      } catch { /* ignore */ }
    }
    setHydrated(true)
    track('wizard_started')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Create listing in DB on first use (if no ID yet) ────────────────────

  useEffect(() => {
    if (!hydrated || listingId) return
    // Create a stub listing for authenticated users (agency or personal)
    // Anonymous users still get a DB record so the preview URL works
    void (async () => {
      try {
        const res = await fetch('/api/listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: project.title, street: project.street, city: project.city }),
        })
        if (!res.ok) return
        const data = (await res.json()) as { listing: { id: string; slug: string } }
        setListingId(data.listing.id)
        setListingSlug(data.listing.slug)
        router.replace(`/builder?id=${data.listing.id}`, { scroll: false } as Parameters<typeof router.replace>[1])
      } catch { /* non-critical — just won't persist to DB */ }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  // ── localStorage write-through (offline resilience) ────────────────────

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem('property-builder-draft', JSON.stringify(project))
  }, [project, hydrated])

  // ── DB auto-save (debounced) ────────────────────────────────────────────

  const saveToDb = useCallback(async (snapshot: PropertyProject, id: string) => {
    setSaveStatus('saving')
    try {
      const data = projectToListingData(snapshot)
      const res = await fetch(`/api/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('save failed')
      // Update slug if the server returned a new one
      const body = (await res.json()) as { listing?: { slug?: string } }
      if (body.listing?.slug) setListingSlug(body.listing.slug)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('error')
    }
  }, [])

  useEffect(() => {
    if (!hydrated || !listingId) return
    setSaveStatus('pending')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void saveToDb(project, listingId)
    }, 1500)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [project, listingId, hydrated, saveToDb])

  // ── Unsaved-changes guard ──────────────────────────────────────────────

  useEffect(() => {
    if (step < 1) return
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (saveStatus === 'saving' || saveStatus === 'pending') {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [step, saveStatus])

  // ── iframe sync (live preview) ─────────────────────────────────────────

  const postToIframe = useCallback((p: PropertyProject) => {
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    try {
      iframe.contentWindow.postMessage({ type: 'plb-update', project: p }, window.location.origin)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    postToIframe(project)
  }, [project, hydrated, postToIframe])

  function handleIframeLoad() { postToIframe(project) }

  // ── Handlers ───────────────────────────────────────────────────────────

  function onChange(partial: Partial<PropertyProject>) {
    setProject((prev) => {
      const next = { ...prev, ...partial }
      if (('street' in partial || 'city' in partial) && !('mapQuery' in partial)) {
        next.mapQuery = `${next.street}, ${next.city}, ישראל`
      }
      return next
    })
  }

  function goToStep(target: number) {
    if (target < 1 || target > TOTAL_STEPS) return
    // Flush save immediately on step navigation
    if (listingId && saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      void saveToDb(project, listingId)
    }
    setStep(target)
    localStorage.setItem('property-builder-step', String(target))
    track(`wizard_step_${target}`, target)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function isNextDisabled() {
    if (step === 1 && !project.city.trim()) return true
    if (step === 3 && !project.rawStory.trim()) return true
    return false
  }

  function nextButtonTitle() {
    if (step === 1 && !project.city.trim()) return 'יש למלא עיר לפני המשך'
    if (step === 3 && !project.rawStory.trim()) return 'יש לכתוב משהו על הנכס לפני המשך'
    return undefined
  }

  const progress = (step / TOTAL_STEPS) * 100
  const isWelcomeScreen = step === 0 || step === -1

  const listingUrl = agencySlug && listingSlug
    ? `/agency/${agencySlug}/listings/${listingSlug}`
    : listingId
    ? `/p/${listingId}`
    : null

  // ── Loading ────────────────────────────────────────────────────────────

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">טוען...</div>
      </div>
    )
  }

  // ── Welcome / Import screens ───────────────────────────────────────────

  if (isWelcomeScreen) {
    return (
      <div dir="rtl" lang="he" className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🏠</div>
            <h1 className="text-2xl font-bold text-gray-900">Property Landing Builder</h1>
            <p className="text-gray-500 mt-1 text-sm">צור דף נחיתה מקצועי לנכס תוך דקות</p>
          </div>

          {step === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 text-center">איך תרצה להתחיל?</h2>
              <button
                type="button"
                onClick={() => setStep(-1)}
                className="w-full text-right flex items-start gap-4 p-4 border-2 border-blue-200 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all group"
              >
                <span className="text-2xl mt-0.5">📋</span>
                <div>
                  <div className="font-semibold text-gray-900 group-hover:text-blue-700">טען ממודעה קיימת</div>
                  <div className="text-sm text-gray-500 mt-0.5">העתק מיד2, מדלן, או כל מודעה — הפרטים ימולאו אוטומטית</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="w-full text-right flex items-start gap-4 p-4 border-2 border-gray-200 hover:border-gray-400 bg-white hover:bg-gray-50 rounded-xl transition-all group"
              >
                <span className="text-2xl mt-0.5">✏️</span>
                <div>
                  <div className="font-semibold text-gray-900">התחל מאפס</div>
                  <div className="text-sm text-gray-500 mt-0.5">מלא את הפרטים שלב אחרי שלב</div>
                </div>
              </button>
            </div>
          )}

          {step === -1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <ImportListing
                onImport={(partial) => { onChange(partial); goToStep(1) }}
                onSkip={() => goToStep(1)}
                agencyId={agencyId}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Wizard (steps 1–9) ─────────────────────────────────────────────────

  return (
    <div dir="rtl" lang="he" className="bg-gray-50 lg:h-screen lg:overflow-hidden lg:grid lg:grid-cols-[500px_1fr]">

      {/* ── Wizard panel ────────────────────────────────────────── */}
      <div className="lg:flex lg:flex-col lg:h-screen lg:overflow-hidden lg:border-l lg:border-gray-200">

        {/* Progress bar */}
        <div className="fixed top-0 right-0 left-0 z-50 lg:static lg:z-auto bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">
                שלב {step} מתוך {TOTAL_STEPS} — {STEP_NAMES[step]}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                {saveStatus === 'saving' && (
                  <><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse inline-block" />שומר...</>
                )}
                {saveStatus === 'saved' && (
                  <><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />נשמר</>
                )}
                {saveStatus === 'error' && (
                  <span className="text-red-500 font-medium">⚠ שגיאה בשמירה</span>
                )}
                {(saveStatus === 'idle' || saveStatus === 'pending') && (
                  <span>{Math.round(progress)}%</span>
                )}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div
              className="flex gap-1 mt-2 overflow-x-auto pb-0.5"
              style={{ scrollbarWidth: 'none' }}
            >
              {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
                <button
                  key={s}
                  ref={s === step ? activePillRef : null}
                  type="button"
                  onClick={() => goToStep(s)}
                  className={`flex-shrink-0 flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full transition-all whitespace-nowrap focus:outline-none ${
                    s === step
                      ? 'bg-blue-600 text-white shadow-sm'
                      : s < step
                      ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] leading-none font-bold flex-shrink-0 ${
                    s === step ? 'bg-white text-blue-600' : s < step ? 'bg-blue-400 text-white' : 'bg-gray-300 text-gray-500'
                  }`}>
                    {s}
                  </span>
                  {STEP_NAMES[s]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step content */}
        <div className="min-h-screen lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <div className="px-4 pt-28 pb-32 lg:pt-5 lg:pb-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-7">
              {step === 1 && <Step1 project={project} onChange={onChange} />}
              {step === 2 && <Step2 project={project} onChange={onChange} />}
              {step === 3 && <Step3 project={project} onChange={onChange} agencyId={agencyId || personalUserId} />}
              {step === 4 && <Step4 project={project} onChange={onChange} />}
              {step === 5 && <Step5 project={project} onChange={onChange} />}
              {step === 6 && <Step6 project={project} onChange={onChange} />}
              {step === 7 && <Step7 project={project} onChange={onChange} />}
              {step === 8 && <Step8 project={project} onChange={onChange} />}
              {step === 9 && <Step9 project={project} listingUrl={listingUrl} />}
            </div>
          </div>
        </div>

        {/* Nav footer */}
        <div className="fixed bottom-0 right-0 left-0 lg:static z-40 bg-white border-t border-gray-200 shadow-lg flex-shrink-0">
          <div className="px-4 py-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => step === 1 ? setStep(0) : goToStep(step - 1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              הקודם
            </button>
            <span className="text-xs text-gray-400">{step} / {TOTAL_STEPS}</span>
            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={() => goToStep(step + 1)}
                disabled={isNextDisabled()}
                title={nextButtonTitle()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium px-5 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                הבא
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : (
              <div className="w-24" />
            )}
          </div>
        </div>
      </div>

      {/* ── Live preview iframe ────────────────────────────────── */}
      <div className="hidden lg:flex lg:flex-col lg:h-screen" dir="ltr">
        <div dir="rtl" className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 border-b border-gray-200 flex-shrink-0">
          <span className="text-sm">👁️</span>
          <span className="text-sm font-medium text-gray-700">תצוגה מקדימה חיה</span>
          <span className="me-auto flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
            מתעדכן בזמן אמת
          </span>
          <a
            href="/preview/local"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            פתח בטאב חדש ↗
          </a>
        </div>
        <iframe
          ref={iframeRef}
          src="/preview/local?embed=1"
          title="תצוגה מקדימה"
          className="flex-1 w-full"
          style={{ border: 'none' }}
          onLoad={handleIframeLoad}
        />
      </div>
    </div>
  )
}
