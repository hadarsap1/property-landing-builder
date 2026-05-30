'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { PropertyProject } from '@/types/project';
import Step1 from '@/components/builder/Step1';
import Step2 from '@/components/builder/Step2';
import Step3 from '@/components/builder/Step3';
import Step4 from '@/components/builder/Step4';
import Step5 from '@/components/builder/Step5';
import Step6 from '@/components/builder/Step6';
import Step7 from '@/components/builder/Step7';
import Step8 from '@/components/builder/Step8';
import Step9 from '@/components/builder/Step9';
import ImportListing from '@/components/builder/ImportListing';
import TutorialModal from '@/components/builder/TutorialModal';
import FeedbackWidget from '@/components/FeedbackWidget';
import ThemeToggle from '@/components/ThemeToggle';

const TUTORIAL_SEEN_KEY = 'plb-tutorial-seen';

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
};

const TOTAL_STEPS = 9;

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
  sectionVisibility: {
    hero: true,
    story: true,
    specs: true,
    gallery: true,
    map: true,
    contact: true,
  },

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

  isPublished: false,
  status: 'available',
};

function track(event: string, step?: number) {
  const sessionId = sessionStorage.getItem('sessionId') ?? '';
  void fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, sessionId, step }),
  });
}

// step === 0 → welcome/import screen
// step === -1 → "import listing" screen
// step 1–9 → wizard steps
export default function BuilderPage() {
  const [step, setStep] = useState(0);
  const [project, setProject] = useState<PropertyProject>(() => {
    if (typeof window !== 'undefined') {
      const t = new URLSearchParams(window.location.search).get('type');
      if (t === 'rent' || t === 'sale') return { ...DEFAULT_PROJECT, listingType: t };
    }
    return DEFAULT_PROJECT;
  });
  const [hydrated, setHydrated] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [nextHint, setNextHint] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const savedFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);
  const activePillRef = useRef<HTMLButtonElement>(null);

  // Init sessionId
  useEffect(() => {
    if (!sessionStorage.getItem('sessionId')) {
      sessionStorage.setItem(
        'sessionId',
        `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`
      );
    }
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('property-builder-draft');
    const urlType = new URLSearchParams(window.location.search).get('type');
    if (saved) {
      try {
        // Merge over defaults so drafts saved before new fields existed
        // (e.g. `status`) stay well-formed.
        const parsed = { ...DEFAULT_PROJECT, ...(JSON.parse(saved) as PropertyProject) };
        if (parsed.videoUrl?.startsWith('blob:')) parsed.videoUrl = '';
        // A draft is always still being edited — never carry a terminal status.
        parsed.status = 'available';
        // URL param always wins over saved draft
        if (urlType === 'rent' || urlType === 'sale') parsed.listingType = urlType;
        setProject(parsed);

        // Restore the last active step so returning from preview lands back here
        const savedStep = parseInt(localStorage.getItem('property-builder-step') ?? '0', 10);
        if (savedStep >= 1 && savedStep <= TOTAL_STEPS) {
          setStep(savedStep);
        } else if (parsed.title || parsed.street || parsed.city) {
          setStep(1);
        }

        if (!parsed.mapQuery && (parsed.street || parsed.city)) {
          setProject((p) => ({ ...p, mapQuery: `${parsed.street}, ${parsed.city}, ישראל` }));
        }
      } catch {
        // ignore malformed localStorage
      }
    }
    // Apply ?template= preset from examples page
    const urlTemplate = new URLSearchParams(window.location.search).get('template') as PropertyProject['template'] | null;
    const validTemplates: PropertyProject['template'][] = ['dark-luxury', 'warm-homey', 'modern-blue', 'nature-space', 'urban-bold'];
    if (urlTemplate && validTemplates.includes(urlTemplate)) {
      setProject((p) => ({ ...p, template: urlTemplate }));
    }

    // Show the intro walkthrough on first ever visit
    if (!localStorage.getItem(TUTORIAL_SEEN_KEY)) {
      setShowTutorial(true);
      track('tutorial_shown');
    }

    setHydrated(true);
    track('wizard_started');
  }, []);

  function closeTutorial() {
    setShowTutorial(false);
    try {
      localStorage.setItem(TUTORIAL_SEEN_KEY, '1');
    } catch {
      // ignore storage failures
    }
  }

  // Save project to localStorage on every change + briefly show "נשמר"
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem('property-builder-draft', JSON.stringify(project));
      setSavedFlash(true);
      if (savedFlashTimer.current) clearTimeout(savedFlashTimer.current);
      savedFlashTimer.current = setTimeout(() => setSavedFlash(false), 1500);
    } catch {
      // Quota exceeded (image-heavy drafts) — autosave skipped, not fatal.
    }
  }, [project, hydrated]);

  // Save current step so returning from preview restores it
  useEffect(() => {
    if (!hydrated || step < 1) return;
    localStorage.setItem('property-builder-step', String(step));
  }, [step, hydrated]);

  // Scroll active step pill into view when step changes
  useEffect(() => {
    activePillRef.current?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [step]);

  // Push project to preview iframe via postMessage (real-time sync)
  const postToIframe = useCallback((p: PropertyProject) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    try {
      iframe.contentWindow.postMessage(
        { type: 'plb-update', project: p },
        window.location.origin
      );
    } catch {
      // ignore — same origin, shouldn't fail
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    postToIframe(project);
  }, [project, hydrated, postToIframe]);

  function handleIframeLoad() {
    postToIframe(project);
  }

  function onChange(partial: Partial<PropertyProject>) {
    setProject((prev) => {
      const next = { ...prev, ...partial };
      if (
        ('street' in partial || 'city' in partial) &&
        !('mapQuery' in partial)
      ) {
        next.mapQuery = `${next.street}, ${next.city}, ישראל`;
      }
      return next;
    });
  }

  function goToStep(target: number) {
    if (target < 1 || target > TOTAL_STEPS) return;
    setStep(target);
    track(`wizard_step_${target}`, target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function isNextDisabled(): boolean {
    if (step === 1 && !project.title.trim()) return true;
    if (step === 3 && !project.rawStory.trim()) return true;
    if (step === 8 && !project.phone.trim()) return true;
    return false;
  }

  const progress = (step / TOTAL_STEPS) * 100;
  const isWelcomeScreen = step === 0 || step === -1;

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--pb-bg)' }}>
        <div style={{ color: 'var(--pb-text2)' }}>טוען...</div>
      </div>
    );
  }

  // ── Welcome / Import screens ────────────────────────────────────────────
  if (isWelcomeScreen) {
    return (
      <div dir="rtl" lang="he" className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--pb-bg)' }}>
        <TutorialModal open={showTutorial} onClose={closeTutorial} />
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🏠</div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--pb-text)' }}>Property Landing Builder</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--pb-text2)' }}>צרו דף נחיתה מקצועי לנכס שלכם תוך דקות</p>
            <button
              type="button"
              onClick={() => setShowTutorial(true)}
              className="mt-2 text-xs underline underline-offset-2"
              style={{ color: 'var(--pb-accent)' }}
            >
              איך זה עובד? צפו במדריך
            </button>
          </div>

          {step === 0 && (
            <div className="rounded-2xl shadow-sm p-6 space-y-4" style={{ background: 'var(--pb-surface)', border: '1px solid var(--pb-border)' }}>
              <h2 className="text-lg font-semibold text-center" style={{ color: 'var(--pb-text)' }}>איך תרצו להתחיל?</h2>

              <button
                type="button"
                onClick={() => setStep(-1)}
                className="w-full text-start flex items-start gap-4 p-4 border-2 rounded-xl transition-all group"
                style={{ borderColor: 'var(--pb-accent)', background: 'color-mix(in srgb, var(--pb-accent) 8%, transparent)' }}
              >
                <span className="text-2xl mt-0.5">📋</span>
                <div>
                  <div className="font-semibold" style={{ color: 'var(--pb-text)' }}>
                    טען ממודעה קיימת
                  </div>
                  <div className="text-sm mt-0.5" style={{ color: 'var(--pb-text2)' }}>
                    העתיקו מיד2, מדלן, או כל מודעה — כל השדות יימולאו אוטומטית
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => goToStep(1)}
                className="w-full text-start flex items-start gap-4 p-4 border-2 rounded-xl transition-all group"
                style={{ borderColor: 'var(--pb-border)', background: 'var(--pb-surface2)' }}
              >
                <span className="text-2xl mt-0.5">✏️</span>
                <div>
                  <div className="font-semibold" style={{ color: 'var(--pb-text)' }}>התחל מאפס</div>
                  <div className="text-sm mt-0.5" style={{ color: 'var(--pb-text2)' }}>
                    הזינו את הפרטים שלב אחרי שלב
                  </div>
                </div>
              </button>
            </div>
          )}

          {step === -1 && (
            <div className="rounded-2xl shadow-sm p-6" style={{ background: 'var(--pb-surface)', border: '1px solid var(--pb-border)' }}>
              <ImportListing
                onImport={(partial) => {
                  onChange(partial);
                  goToStep(1);
                }}
                onSkip={() => goToStep(1)}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Wizard (steps 1–9) — split layout on lg+ ───────────────────────────
  //
  // Desktop: two-column grid (wizard left | preview right)
  // Mobile: single column with fixed header + footer
  //
  // RTL note: CSS grid respects writing-mode, so in dir="rtl" the first
  // grid column is physically on the RIGHT and second is on the LEFT.
  // That's intentional — wizard on right feels natural in Hebrew UIs.

  return (
    <div dir="rtl" lang="he" className="lg:h-screen lg:overflow-hidden lg:grid lg:grid-cols-[500px_1fr]" style={{ background: 'var(--pb-bg)' }}>

      {/* ── LEFT PANEL: wizard ─────────────────────────────────── */}
      <div className="lg:flex lg:flex-col lg:h-screen lg:overflow-hidden" style={{ borderLeft: '1px solid var(--pb-border)' }}>

        {/* Progress bar */}
        <div className="fixed top-0 right-0 left-0 z-50 lg:static lg:z-auto shadow-sm flex-shrink-0" style={{ background: 'var(--pb-surface)', borderBottom: '1px solid var(--pb-border)' }}>
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--pb-text)' }}>
                שלב {step} מתוך {TOTAL_STEPS}: {STEP_NAMES[step]}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs transition-opacity duration-300 ${savedFlash ? 'text-green-500 opacity-100' : 'opacity-0'}`}
                  aria-live="polite"
                >
                  ✓ נשמר
                </span>
                <span className="text-sm" style={{ color: 'var(--pb-text2)' }}>{Math.round(progress)}%</span>
                <ThemeToggle />
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--pb-surface2)' }}>
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Step pills — clickable, labeled, scrollable */}
            <div
              ref={pillsRef}
              className="flex gap-1 mt-2 overflow-x-auto pb-0.5"
              style={{ scrollbarWidth: 'none' }}
            >
              {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
                <button
                  key={s}
                  ref={s === step ? activePillRef : null}
                  type="button"
                  onClick={() => goToStep(s)}
                  className="flex-shrink-0 flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full transition-all whitespace-nowrap focus:outline-none"
                  style={
                    s === step
                      ? { background: 'var(--pb-accent)', color: '#fff' }
                      : s < step
                      ? { background: 'color-mix(in srgb, var(--pb-accent) 15%, transparent)', color: 'var(--pb-accent)' }
                      : { background: 'var(--pb-surface2)', color: 'var(--pb-text2)' }
                  }
                >
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] leading-none font-bold flex-shrink-0"
                    style={
                      s === step
                        ? { background: '#fff', color: 'var(--pb-accent)' }
                        : s < step
                        ? { background: 'var(--pb-accent)', color: '#fff', opacity: 0.7 }
                        : { background: 'var(--pb-border)', color: 'var(--pb-text2)' }
                    }
                  >
                    {s}
                  </span>
                  {STEP_NAMES[s]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step content
            Mobile: padded for fixed header/footer, min-h-screen
            Desktop: flex-1, overflow-y-auto (scrollable within column) */}
        <div className="min-h-screen lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <div className="px-4 pt-28 pb-32 lg:pt-5 lg:pb-5">
            <div className="rounded-2xl shadow-sm p-5 sm:p-7" style={{ background: 'var(--pb-surface)', border: '1px solid var(--pb-border)' }}>
              {step === 1 && <Step1 project={project} onChange={onChange} />}
              {step === 2 && <Step2 project={project} onChange={onChange} />}
              {step === 3 && <Step3 project={project} onChange={onChange} />}
              {step === 4 && <Step4 project={project} onChange={onChange} />}
              {step === 5 && <Step5 project={project} onChange={onChange} />}
              {step === 6 && <Step6 project={project} onChange={onChange} />}
              {step === 7 && <Step7 project={project} onChange={onChange} />}
              {step === 8 && <Step8 project={project} onChange={onChange} />}
              {step === 9 && <Step9 project={project} onChange={onChange} />}
            </div>
          </div>
        </div>

        {/* Nav footer
            Mobile: fixed to bottom of viewport (full-width)
            Desktop: static, at bottom of left column */}
        <div className="fixed bottom-0 right-0 left-0 lg:static z-40 flex-shrink-0"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', background: 'var(--pb-surface)', borderTop: '1px solid var(--pb-border)', boxShadow: '0 -4px 16px rgba(0,0,0,0.06)' }}>
          <div className="px-4 py-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => step === 1 ? setStep(0) : goToStep(step - 1)}
              className="flex items-center gap-2 font-medium px-4 py-2 rounded-lg transition-colors"
              style={{ color: 'var(--pb-text2)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--pb-surface2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--pb-text)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--pb-text2)'; }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              הקודם
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs" dir="ltr" style={{ color: 'var(--pb-text2)' }}>{step} / {TOTAL_STEPS}</span>
              <FeedbackWidget />
            </div>

            {step < TOTAL_STEPS ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (isNextDisabled()) {
                      setNextHint(true);
                      setTimeout(() => setNextHint(false), 2200);
                      return;
                    }
                    goToStep(step + 1);
                  }}
                  className={`flex items-center gap-2 text-white font-medium px-5 py-2 rounded-lg transition-colors ${
                    isNextDisabled() ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  הבא
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {nextHint && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-gray-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg pointer-events-none">
                    {step === 1 && 'הזן כותרת לנכס כדי להמשיך'}
                    {step === 3 && 'כתוב משהו על הנכס כדי להמשיך'}
                    {step === 8 && 'הזן מספר טלפון כדי להמשיך'}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                  </div>
                )}
              </div>
            ) : (
              <div className="w-24" />
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile preview button — visible on small screens only ─── */}
      <div className="lg:hidden fixed bottom-16 left-4 z-40">
        <a
          href="/preview/local"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg transition-colors"
          aria-label="פתח תצוגה מקדימה"
        >
          👁️ תצוגה
        </a>
      </div>

      {/* ── RIGHT PANEL: live preview iframe ──────────────────────── */}
      {/* Only visible on lg+ screens */}
      <div className="hidden lg:flex lg:flex-col lg:h-screen" dir="ltr">
        {/* Panel header */}
        <div
          dir="rtl"
          className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0"
          style={{ background: 'var(--pb-surface2)', borderBottom: '1px solid var(--pb-border)' }}
        >
          <span className="text-sm">👁️</span>
          <span className="text-sm font-medium" style={{ color: 'var(--pb-text)' }}>תצוגה מקדימה חיה</span>
          {/* Pulse indicator */}
          <span className="me-auto flex items-center gap-1.5 text-xs" style={{ color: 'var(--pb-text2)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
            מתעדכן בזמן אמת
          </span>
          {/* Open in new tab */}
          <a
            href="/preview/local"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            פתח בטאב חדש ↗
          </a>
        </div>

        {/* iframe fills the rest of the right column */}
        <iframe
          ref={iframeRef}
          src="/preview/local?embed=1"
          title="תצוגה מקדימה"
          className="flex-1 w-full"
          style={{ border: 'none' }}
          onLoad={handleIframeLoad}
        />
      </div>
      <FeedbackWidget />
      <TutorialModal open={showTutorial} onClose={closeTutorial} />
    </div>
  );
}
