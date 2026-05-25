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

  async function copyCode(c: string) {
    await navigator.clipboard.writeText(c);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const previewUrl = code ? `/preview/${code}` : null;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">סיום 🎉</h2>

      {/* ── Local preview (always available) ───────────────────── */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-gray-800">תצוגה מקדימה</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              ראה איך הדף שלך נראה — מבוסס על הטיוטה המקומית
            </p>
          </div>
          <Link
            href="/preview/local"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            👁️ פתח תצוגה מקדימה
          </Link>
        </div>
      </div>

      {/* ── Save & share ────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-700 mb-1">שמור ושתף</h3>
        <p className="text-sm text-gray-500 mb-5">
          שמירה תיצור קישור שתוכל לשלוח לכל אחד. תוקף: 90 יום.
        </p>

        {code ? (
          <div className="space-y-4">
            {/* Code display */}
            <div className="bg-white rounded-xl border border-blue-200 p-4 flex items-center gap-3">
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">קוד גישה</div>
                <div className="text-3xl font-bold tracking-widest text-blue-700">{code}</div>
              </div>
              <button
                type="button"
                onClick={() => void copyCode(code)}
                className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-medium transition-colors"
              >
                {copied ? '✓ הועתק' : 'העתק'}
              </button>
            </div>

            {/* Preview link */}
            <Link
              href={`/preview/${code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              🚀 פתח את דף הנחיתה שלך
            </Link>

            {/* Share actions */}
            <div className="flex gap-2">
              <a
                href={`mailto:?subject=${encodeURIComponent('דף הנחיתה לנכס')}&body=${encodeURIComponent(`הקוד שלך: ${code}\nקישור: ${typeof window !== 'undefined' ? `${window.location.origin}/preview/${code}` : ''}`)}`}
                className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm py-2 rounded-lg transition-colors"
              >
                📧 שלח במייל
              </a>
              {typeof window !== 'undefined' && (
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`דף הנחיתה לנכס: ${window.location.origin}/preview/${code}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 text-sm py-2 rounded-lg transition-colors"
                >
                  💬 שלח ב-WhatsApp
                </a>
              )}
            </div>

            <p className="text-xs text-gray-400 text-center">
              {previewUrl && typeof window !== 'undefined'
                ? `${window.location.origin}${previewUrl}`
                : ''}
            </p>
          </div>
        ) : (
          <div className="text-center">
            {error && (
              <p className="text-sm text-red-600 mb-3 bg-red-50 rounded-lg p-3">{error}</p>
            )}
            <button
              type="button"
              onClick={() => void saveProject()}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
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

      {/* ── Summary ─────────────────────────────────────────────── */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-600 mb-3">סיכום הנכס</h4>
        <dl className="grid grid-cols-2 gap-2 text-sm">
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
    </div>
  );
}
