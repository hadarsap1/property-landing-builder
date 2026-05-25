'use client';

import { useState, useEffect } from 'react';
import type { PropertyProject } from '@/types/project';

interface StepProps {
  project: PropertyProject;
}

export default function Step9({ project }: StepProps) {
  const [code, setCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Track project_completed on mount
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

  const mailtoLink = code
    ? `mailto:?subject=${encodeURIComponent('קוד הגישה לנכס')}&body=${encodeURIComponent(`הקוד שלך: ${code}`)}`
    : '#';

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">סיום 🎉</h2>

      {/* Access Code */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">קוד גישה לנכס</h3>

        {code ? (
          <div className="text-center">
            <div className="text-5xl font-bold tracking-widest text-blue-700 bg-white rounded-xl py-4 px-6 border border-blue-200 inline-block mb-3">
              {code}
            </div>
            <p className="text-sm text-gray-600 font-medium">שמור את הקוד הזה לעצמך!</p>
            <p className="text-xs text-gray-400 mt-1">תוקף: 90 יום</p>

            <div className="mt-4">
              <a
                href={mailtoLink}
                className="inline-flex items-center gap-2 bg-white border border-blue-300 hover:bg-blue-50 text-blue-700 px-5 py-2.5 rounded-lg font-medium transition-colors text-sm"
              >
                📧 שלח לעצמי במייל
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              לחץ על הכפתור כדי לשמור את הנכס ולקבל קוד גישה
            </p>
            {error && (
              <p className="text-sm text-red-600 mb-3">{error}</p>
            )}
            <button
              type="button"
              onClick={() => void saveProject()}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 mx-auto"
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
                'צור קוד גישה'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Export options */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">אפשרויות פרסום</h3>
        <div className="space-y-3">
          {[
            { label: '📥 הורד HTML', note: 'בקרוב' },
            { label: '▲ Deploy to Vercel', note: 'בקרוב' },
            { label: '🐙 GitHub Pages', note: 'בקרוב' },
          ].map(({ label, note }) => (
            <div key={label} className="flex items-center gap-3">
              <button
                type="button"
                disabled
                className="flex-1 border border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed rounded-lg px-4 py-3 text-right font-medium flex items-center justify-between"
              >
                <span>{label}</span>
                <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                  {note}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-600 mb-3">סיכום הנכס</h4>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {project.title && (
            <>
              <dt className="text-gray-500">כותרת</dt>
              <dd className="text-gray-800 font-medium">{project.title}</dd>
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
              <dd className="text-gray-800">{project.builtArea} מ"ר</dd>
            </>
          )}
          {project.images.length > 0 && (
            <>
              <dt className="text-gray-500">תמונות</dt>
              <dd className="text-gray-800">{project.images.length}</dd>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}
