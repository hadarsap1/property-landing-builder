'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { PropertyProject } from '@/types/project';

interface StepProps {
  project: PropertyProject;
}

export default function Step9({ project }: StepProps) {
  const [code, setCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sessionId = sessionStorage.getItem('sessionId') ?? '';
    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'project_completed', sessionId }),
    });
  }, []);

  async function saveProject() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/save-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      });
      if (!res.ok) {
        const errData = (await res.json()) as { error?: string };
        throw new Error(errData.error ?? 'שגיאה בשמירה');
      }
      const data = (await res.json()) as { code: string };
      setCode(data.code);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה לא צפויה');
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    if (!code) return;
    const url = `${window.location.origin}/preview/${code}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const previewUrl = code ? `/preview/${code}` : null;
  const fullUrl = code && typeof window !== 'undefined' ? `${window.location.origin}/preview/${code}` : '';

  return (
    <div className="space-y-6">

      {/* ── Celebration header ──────────────────────────────────── */}
      <div className="text-center py-4">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">הדף שלך מוכן!</h2>
        <p className="text-gray-500 text-sm">
          {project.aiTitle || project.title || 'הנכס שלך'} נראה מדהים
        </p>
      </div>

      {/* ── What to do now ───────────────────────────────────────── */}
      <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
        <h3 className="font-semibold text-blue-900 mb-3 text-sm uppercase tracking-wide">
          מה עכשיו?
        </h3>
        <ol className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">1</span>
            <div>
              <p className="font-medium text-gray-800 text-sm">שמור וקבל קישור</p>
              <p className="text-xs text-gray-500">לחץ על "שמור וקבל קישור" למטה — תקבל קוד 6 ספרות וקישור ישיר</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">2</span>
            <div>
              <p className="font-medium text-gray-800 text-sm">שתף ב-WhatsApp / מייל</p>
              <p className="text-xs text-gray-500">שלח את הקישור לקונים פוטנציאליים, לסוכנים, לקבוצות</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">3</span>
            <div>
              <p className="font-medium text-gray-800 text-sm">רוצה לשנות משהו?</p>
              <p className="text-xs text-gray-500">חזור לכל שלב דרך הניווט למעלה — השינויים יישמרו אוטומטית בטיוטה</p>
            </div>
          </li>
        </ol>
      </div>

      {/* ── Local preview ────────────────────────────────────────── */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-gray-800 text-sm">תצוגה מקדימה מקומית</p>
          <p className="text-xs text-gray-500 mt-0.5">ראה את הדף לפני השמירה</p>
        </div>
        <Link
          href="/preview/local"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 flex items-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          👁️ תצוגה מקדימה
        </Link>
      </div>

      {/* ── Save & share ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        {code ? (
          <div className="space-y-4">
            {/* Success */}
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <span className="text-lg">✅</span>
              <span className="font-semibold text-sm">הדף נשמר בהצלחה! הקישור שלך מוכן.</span>
            </div>

            {/* Preview link — primary CTA */}
            <Link
              href={`/preview/${code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors text-base shadow-sm"
            >
              🚀 פתח את דף הנחיתה שלך
            </Link>

            {/* Copy link row */}
            <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-xl px-4 py-3">
              <p className="flex-1 text-sm text-gray-500 truncate font-mono">{fullUrl}</p>
              <button
                type="button"
                onClick={() => void copyLink()}
                className="flex-shrink-0 flex items-center gap-1.5 text-sm font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                {copied ? '✓ הועתק' : 'העתק'}
              </button>
            </div>

            {/* Access code */}
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
              <div>
                <div className="text-xs text-gray-400 mb-0.5">קוד גישה (שמור אצלך)</div>
                <div className="text-2xl font-bold tracking-widest text-blue-700">{code}</div>
              </div>
              <div className="text-xs text-gray-400 text-left">
                <p>תוקף: 90 יום</p>
                <p>כתובת: <span className="font-mono">/preview/{code}</span></p>
              </div>
            </div>

            {/* Share buttons */}
            <div className="flex gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`🏠 ${project.aiTitle || project.title || 'נכס למכירה'}\nלצפייה בדף הנחיתה: ${fullUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                💬 WhatsApp
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(project.aiTitle || project.title || 'נכס למכירה')}&body=${encodeURIComponent(`שלום,\nמצורף קישור לדף הנחיתה:\n${fullUrl}`)}`}
                className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                📧 מייל
              </a>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">שמור ושתף</h3>
            <p className="text-sm text-gray-500 mb-4">
              שמירה תיצור קישור ייחודי שתוכל לשלוח לכל אחד. תוקף: 90 יום.
            </p>
            {error && (
              <p className="text-sm text-red-600 mb-3 bg-red-50 rounded-lg p-3">{error}</p>
            )}
            <button
              type="button"
              onClick={() => void saveProject()}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-3.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-base"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  שומר...
                </>
              ) : (
                '💾 שמור וקבל קישור לשיתוף'
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── Property summary ─────────────────────────────────────── */}
      <details className="group bg-gray-50 rounded-xl border border-gray-200">
        <summary className="px-4 py-3 text-sm font-semibold text-gray-600 cursor-pointer list-none flex items-center justify-between">
          סיכום הנכס
          <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="px-4 pb-4">
          <dl className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-gray-200">
            {project.title && (
              <>
                <dt className="text-gray-500">כותרת</dt>
                <dd className="text-gray-800 font-medium">{project.aiTitle || project.title}</dd>
              </>
            )}
            {project.city && (
              <>
                <dt className="text-gray-500">מיקום</dt>
                <dd className="text-gray-800">{[project.street, project.city].filter(Boolean).join(', ')}</dd>
              </>
            )}
            {project.rooms && (
              <>
                <dt className="text-gray-500">חדרים</dt>
                <dd className="text-gray-800">{project.rooms}</dd>
              </>
            )}
            {project.builtArea && (
              <>
                <dt className="text-gray-500">שטח</dt>
                <dd className="text-gray-800">{project.builtArea} מ״ר</dd>
              </>
            )}
            {project.images.length > 0 && (
              <>
                <dt className="text-gray-500">תמונות</dt>
                <dd className="text-gray-800">{project.images.length}</dd>
              </>
            )}
            <dt className="text-gray-500">תבנית</dt>
            <dd className="text-gray-800">{project.template}</dd>
          </dl>
        </div>
      </details>

      {/* ── Start new ────────────────────────────────────────────── */}
      <div className="text-center pt-2 pb-1">
        <button
          type="button"
          onClick={() => {
            if (confirm('להתחיל נכס חדש? הטיוטה הנוכחית תימחק.')) {
              localStorage.removeItem('property-builder-draft');
              window.location.reload();
            }
          }}
          className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
        >
          + התחל נכס חדש
        </button>
      </div>

    </div>
  );
}
