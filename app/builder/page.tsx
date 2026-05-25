'use client';

import { useState, useEffect } from 'react';
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
  title: '',
  street: '',
  city: '',
  neighborhood: '',
  price: null,
  priceOnRequest: false,
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

  sellerName: '',
  phone: '',
  whatsapp: '',
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
  const [project, setProject] = useState<PropertyProject>(DEFAULT_PROJECT);
  const [hydrated, setHydrated] = useState(false);

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
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as PropertyProject;
        setProject(parsed);
        // If there's a saved draft with content, skip welcome screen
        if (parsed.title || parsed.street || parsed.city) {
          setStep(1);
        }
        // Sync mapQuery from address if not set
        if (!parsed.mapQuery && (parsed.street || parsed.city)) {
          setProject((p) => ({
            ...p,
            mapQuery: `${parsed.street}, ${parsed.city}, ישראל`,
          }));
        }
      } catch {
        // ignore malformed localStorage
      }
    }
    setHydrated(true);
    track('wizard_started');
  }, []);

  // Save to localStorage on every change
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem('property-builder-draft', JSON.stringify(project));
  }, [project, hydrated]);

  function onChange(partial: Partial<PropertyProject>) {
    setProject((prev) => {
      const next = { ...prev, ...partial };
      // Keep mapQuery in sync with address unless manually changed
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
    if (step === 3 && !project.rawStory.trim()) return true;
    return false;
  }

  const progress = (step / TOTAL_STEPS) * 100;
  const isWelcomeScreen = step === 0 || step === -1;

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">טוען...</div>
      </div>
    );
  }

  // ── Welcome / Import screens (no progress bar, no footer) ──────────────
  if (isWelcomeScreen) {
    return (
      <div dir="rtl" lang="he" className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Logo/header */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🏠</div>
            <h1 className="text-2xl font-bold text-gray-900">Property Landing Builder</h1>
            <p className="text-gray-500 mt-1 text-sm">צור דף נחיתה מקצועי לדירה שלך תוך דקות</p>
          </div>

          {step === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 text-center">איך תרצה להתחיל?</h2>

              {/* Import option */}
              <button
                type="button"
                onClick={() => setStep(-1)}
                className="w-full text-right flex items-start gap-4 p-4 border-2 border-blue-200 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all group"
              >
                <span className="text-2xl mt-0.5">📋</span>
                <div>
                  <div className="font-semibold text-gray-900 group-hover:text-blue-700">
                    טען ממודעה קיימת
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    העתק מיד2, מדלן, או כל מודעה — הוויזרד ימולא אוטומטית
                  </div>
                </div>
              </button>

              {/* Start from scratch */}
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="w-full text-right flex items-start gap-4 p-4 border-2 border-gray-200 hover:border-gray-400 bg-white hover:bg-gray-50 rounded-xl transition-all group"
              >
                <span className="text-2xl mt-0.5">✏️</span>
                <div>
                  <div className="font-semibold text-gray-900">התחל מאפס</div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    מלא את הפרטים שלב אחרי שלב
                  </div>
                </div>
              </button>
            </div>
          )}

          {step === -1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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

  // ── Wizard (steps 1–9) ─────────────────────────────────────────────────
  return (
    <div dir="rtl" lang="he" className="min-h-screen bg-gray-50">
      {/* Progress bar */}
      <div className="fixed top-0 right-0 left-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">
              שלב {step} מתוך {TOTAL_STEPS} — {STEP_NAMES[step]}
            </span>
            <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Step dots */}
          <div className="flex gap-1 mt-2 justify-center">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => goToStep(s)}
                title={STEP_NAMES[s]}
                className={`w-2 h-2 rounded-full transition-colors ${
                  s === step
                    ? 'bg-blue-600'
                    : s < step
                    ? 'bg-blue-300'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4 pt-28 pb-32">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          {step === 1 && <Step1 project={project} onChange={onChange} />}
          {step === 2 && <Step2 project={project} onChange={onChange} />}
          {step === 3 && <Step3 project={project} onChange={onChange} />}
          {step === 4 && <Step4 project={project} onChange={onChange} />}
          {step === 5 && <Step5 project={project} onChange={onChange} />}
          {step === 6 && <Step6 project={project} onChange={onChange} />}
          {step === 7 && <Step7 project={project} onChange={onChange} />}
          {step === 8 && <Step8 project={project} onChange={onChange} />}
          {step === 9 && <Step9 project={project} />}
        </div>
      </div>

      {/* Navigation footer */}
      <div className="fixed bottom-0 right-0 left-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Back button — right side in RTL */}
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

          <span className="text-xs text-gray-400">
            {step} / {TOTAL_STEPS}
          </span>

          {/* Next button — left side in RTL */}
          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={() => goToStep(step + 1)}
              disabled={isNextDisabled()}
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
  );
}
