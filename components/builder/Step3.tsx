'use client';

import { useState } from 'react';
import type { PropertyProject } from '@/types/project';

interface StepProps {
  project: PropertyProject;
  onChange: (partial: Partial<PropertyProject>) => void;
  agencyId?: string;
}

interface AIResult {
  title: string;
  tagline: string;
  story: string;
  highlights: string[];
}

export default function Step3({ project, onChange, agencyId }: StepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateAI() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      });

      if (!res.ok) {
        const errData = (await res.json()) as { error?: string };
        throw new Error(errData.error ?? 'שגיאה בייצור תוכן');
      }

      const data = (await res.json()) as AIResult;

      // Track AI generate event
      void fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'ai_generate',
          sessionId: sessionStorage.getItem('sessionId') ?? '',
        }),
      });

      onChange({
        aiTitle: data.title ?? '',
        aiTagline: data.tagline ?? '',
        aiStory: data.story ?? '',
        aiHighlights: Array.isArray(data.highlights) ? data.highlights : [],
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה לא צפויה');
    } finally {
      setLoading(false);
    }
  }

  const hasAIContent = project.aiStory || project.aiTitle;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">הסיפור של הנכס</h2>

      {/* Raw story textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ספר לנו על הדירה במילים שלך
        </label>
        <textarea
          value={project.rawStory}
          onChange={(e) => onChange({ rawStory: e.target.value })}
          rows={6}
          placeholder="כתוב כאן בחופשיות..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
        <p className="text-sm text-gray-400 mt-1">
          מה הדבר הכי מיוחד? מה אהבת לעשות בה? מה יש בשכונה?
        </p>
      </div>

      {/* AI Generate button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void generateAI()}
          disabled={loading || !project.rawStory.trim()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              מייצר...
            </>
          ) : (
            <>{hasAIContent ? '🔄 ייצר מחדש' : '✨ נסח בעזרת AI'}</>
          )}
        </button>
        {!project.rawStory.trim() && (
          <span className="text-sm text-gray-400">יש לכתוב משהו קודם</span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* AI Result section */}
      {hasAIContent && (
        <div className="space-y-4 border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-700">תוצאת ה-AI</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">כותרת</label>
            <input
              type="text"
              value={project.aiTitle}
              onChange={(e) => onChange({ aiTitle: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תגית</label>
            <input
              type="text"
              value={project.aiTagline}
              onChange={(e) => onChange({ aiTagline: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סיפור הנכס</label>
            <textarea
              value={project.aiStory}
              onChange={(e) => onChange({ aiStory: e.target.value })}
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">נקודות מרכזיות</label>
            <div className="space-y-2">
              {project.aiHighlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-blue-500">•</span>
                  <input
                    type="text"
                    value={h}
                    onChange={(e) => {
                      const updated = [...project.aiHighlights];
                      updated[i] = e.target.value;
                      onChange({ aiHighlights: updated });
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = project.aiHighlights.filter((_, idx) => idx !== i);
                      onChange({ aiHighlights: updated });
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => onChange({ aiHighlights: [...project.aiHighlights, ''] })}
                className="text-sm text-blue-600 hover:underline mt-1"
              >
                + הוסף נקודה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
