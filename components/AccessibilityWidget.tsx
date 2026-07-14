'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Self-hosted accessibility widget (רכיב נגישות) for public landing pages.
// Toggles CSS classes on <html> (styles in globals.css) and persists choices.
// The widget complements — not replaces — accessible markup (תקן 5568).

const STORAGE_KEY = 'pb-a11y';

interface A11yPrefs {
  textScale: 0 | 1 | 2;    // 100% / 112.5% / 125%
  contrast: boolean;
  underline: boolean;
  noMotion: boolean;
}

const DEFAULTS: A11yPrefs = { textScale: 0, contrast: false, underline: false, noMotion: false };

function applyPrefs(p: A11yPrefs) {
  const root = document.documentElement;
  root.classList.toggle('a11y-text-1', p.textScale === 1);
  root.classList.toggle('a11y-text-2', p.textScale === 2);
  root.classList.toggle('a11y-contrast', p.contrast);
  root.classList.toggle('a11y-underline', p.underline);
  root.classList.toggle('a11y-no-motion', p.noMotion);
}

export default function AccessibilityWidget({ raised = false }: { raised?: boolean }) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULTS);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = { ...DEFAULTS, ...(JSON.parse(saved) as Partial<A11yPrefs>) };
        setPrefs(parsed);
        applyPrefs(parsed);
      }
    } catch { /* corrupt storage — start fresh */ }
  }, []);

  const update = useCallback((patch: Partial<A11yPrefs>) => {
    setPrefs(prev => {
      const next = { ...prev, ...patch };
      applyPrefs(next);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* private mode */ }
      return next;
    });
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const options: { key: keyof A11yPrefs | 'reset'; label: string; active: boolean; onClick: () => void }[] = [
    {
      key: 'textScale',
      label: prefs.textScale === 0 ? 'הגדלת טקסט' : prefs.textScale === 1 ? 'טקסט גדול (112%)' : 'טקסט גדול מאוד (125%)',
      active: prefs.textScale > 0,
      onClick: () => update({ textScale: ((prefs.textScale + 1) % 3) as A11yPrefs['textScale'] }),
    },
    { key: 'contrast',  label: 'ניגודיות מוגברת', active: prefs.contrast,  onClick: () => update({ contrast: !prefs.contrast }) },
    { key: 'underline', label: 'הדגשת קישורים',   active: prefs.underline, onClick: () => update({ underline: !prefs.underline }) },
    { key: 'noMotion',  label: 'עצירת אנימציות',  active: prefs.noMotion,  onClick: () => update({ noMotion: !prefs.noMotion }) },
    { key: 'reset',     label: 'איפוס הגדרות',    active: false,           onClick: () => update(DEFAULTS) },
  ];

  return (
    <div dir="rtl" className={`fixed left-3 z-50 ${raised ? 'bottom-20' : 'bottom-3'}`}>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="אפשרויות נגישות"
          className="mb-2 w-56 rounded-2xl bg-white text-gray-900 shadow-2xl border border-gray-200 p-3 space-y-1"
        >
          <p className="text-sm font-bold px-2 pb-1">אפשרויות נגישות</p>
          {options.map(opt => (
            <button
              key={opt.key}
              type="button"
              aria-pressed={opt.key === 'reset' ? undefined : opt.active}
              onClick={opt.onClick}
              className={`w-full text-right text-sm rounded-xl px-3 py-2 transition-colors border ${
                opt.active
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <a
            href="/accessibility"
            className="block text-center text-xs text-blue-600 hover:underline pt-1"
          >
            הצהרת נגישות
          </a>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={open ? 'סגירת תפריט נגישות' : 'פתיחת תפריט נגישות'}
        className="w-12 h-12 rounded-full bg-blue-700 hover:bg-blue-800 text-white shadow-xl flex items-center justify-center border-2 border-white"
      >
        {/* Universal accessibility icon */}
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" aria-hidden="true">
          <circle cx="12" cy="4.5" r="2" />
          <path d="M12 8c-.4 0-4.7-.5-6.8-.8a.9.9 0 0 0-1 .8c-.1.5.3 1 .8 1l5 .9v2.6l-2.3 6.6a.9.9 0 0 0 .6 1.2.9.9 0 0 0 1.1-.6L12 14l2.6 5.7a.9.9 0 0 0 1.1.6.9.9 0 0 0 .6-1.2L14 12.5V9.9l5-.9c.5-.1.9-.5.8-1a.9.9 0 0 0-1-.8C16.7 7.5 12.4 8 12 8z" />
        </svg>
      </button>
    </div>
  );
}
