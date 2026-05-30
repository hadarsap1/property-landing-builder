'use client';

import { useState, useRef } from 'react';
import type { PropertyProject } from '@/types/project';

interface StepProps {
  project: PropertyProject;
  onChange: (partial: Partial<PropertyProject>) => void;
}

interface AIResult {
  title: string;
  tagline: string;
  story: string;
  highlights: string[];
}

interface WordCategory {
  label: string;
  words: string[];
}

const WORD_BANK: WordCategory[] = [
  {
    label: 'מיקום',
    words: ['מרכזי', 'שקט', 'ירוק', 'פנורמי', 'ליד הים', 'ליד פארק', 'ליד מוסדות חינוך', 'קהילה חמה', 'שכונה משפחתית'],
  },
  {
    label: 'מצב הנכס',
    words: ['משופץ לחלוטין', 'חדש מהקבלן', 'שמור מצוין', 'מעוצב', 'בנייה חדשה', 'לופט', 'פנטהאוז', 'צמוד קרקע'],
  },
  {
    label: 'תכונות',
    words: ['אור טבעי', 'נוף פתוח', 'גינה פרטית', 'מרפסת שמש', 'חנייה מקורה', 'מחסן', 'ממ"ד', 'מעלית', 'מטבח מאובזר'],
  },
  {
    label: 'אווירה',
    words: ['מרווח', 'אינטימי', 'יוקרתי', 'מושלם למשפחה', 'ייחודי', 'חם ומזמין', 'מלא אור'],
  },
];

const inputCls = 'w-full rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';
const inputStyle = { background: 'var(--pb-surface)', border: '1px solid var(--pb-border)', color: 'var(--pb-text)' };
const labelStyle = { color: 'var(--pb-text2)', fontSize: '0.875rem', fontWeight: 500 };

export default function Step3({ project, onChange }: StepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [aiHint, setAiHint] = useState(false);
  const aiResultRef = useRef<HTMLDivElement>(null);

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
      setTimeout(() => aiResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה לא צפויה');
    } finally {
      setLoading(false);
    }
  }

  function appendWord(word: string) {
    const current = project.rawStory.trim();
    const separator = current.length === 0 ? '' : /[,.?!:\s]$/.test(current) ? ' ' : ', ';
    onChange({ rawStory: current + separator + word });
  }

  const hasAIContent = project.aiStory || project.aiTitle;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: 'var(--pb-text)' }}>הסיפור של הנכס</h2>

      {/* Raw story textarea */}
      <div>
        <label className="block mb-1" style={labelStyle}>
          ספרו לנו על הנכס במילים שלכם
        </label>
        <textarea
          value={project.rawStory}
          onChange={(e) => onChange({ rawStory: e.target.value })}
          rows={5}
          placeholder="כתבו כאן בחופשיות — מה הדבר הכי מיוחד? מה יש בשכונה? מה אהבתם בדירה?"
          className={`${inputCls} resize-y`}
          style={inputStyle}
        />
      </div>

      {/* Word bank */}
      <div>
        <p className="mb-2" style={labelStyle}>
          השראה — לחצו על מילה להוסיף לטקסט
        </p>
        <div className="space-y-2">
          {WORD_BANK.map((cat) => {
            const isOpen = openCategory === cat.label;
            return (
              <div key={cat.label} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--pb-border)' }}>
                <button
                  type="button"
                  onClick={() => setOpenCategory(isOpen ? null : cat.label)}
                  className="w-full flex items-center justify-between px-3 py-2 transition-colors text-sm font-medium"
                  style={{ background: 'var(--pb-surface2)', color: 'var(--pb-text)' }}
                >
                  <span>{cat.label}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--pb-text2)' }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-3 py-2 flex flex-wrap gap-2" style={{ background: 'var(--pb-surface)' }}>
                    {cat.words.map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => appendWord(w)}
                        className="text-xs px-2.5 py-1 rounded-full transition-colors"
                        style={{ background: 'color-mix(in srgb, var(--pb-accent) 12%, transparent)', color: 'var(--pb-accent)', border: '1px solid color-mix(in srgb, var(--pb-accent) 30%, transparent)' }}
                      >
                        + {w}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Generate button */}
      <div className="relative flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (loading) return;
            if (!project.rawStory.trim()) {
              setAiHint(true);
              setTimeout(() => setAiHint(false), 2200);
              return;
            }
            void generateAI();
          }}
          className={`flex items-center gap-2 text-white px-5 py-2.5 rounded-lg font-medium transition-colors ${
            loading || !project.rawStory.trim() ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
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
        {aiHint && (
          <div className="absolute bottom-full right-0 mb-2 whitespace-nowrap bg-gray-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg pointer-events-none">
            כתוב משהו על הנכס כדי להמשיך
            <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-800" />
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ background: 'color-mix(in srgb, #ef4444 10%, transparent)', border: '1px solid color-mix(in srgb, #ef4444 30%, transparent)', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {/* AI Result section */}
      {hasAIContent && (
        <div ref={aiResultRef} className="space-y-4 pt-6" style={{ borderTop: '1px solid var(--pb-border)' }}>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--pb-text)' }}>תוצאת ה-AI</h3>

          <div>
            <label className="block mb-1" style={labelStyle}>כותרת</label>
            <input
              type="text"
              value={project.aiTitle}
              onChange={(e) => onChange({ aiTitle: e.target.value })}
              className={inputCls}
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block mb-1" style={labelStyle}>תגית</label>
            <input
              type="text"
              value={project.aiTagline}
              onChange={(e) => onChange({ aiTagline: e.target.value })}
              className={inputCls}
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block mb-1" style={labelStyle}>סיפור הנכס</label>
            <textarea
              value={project.aiStory}
              onChange={(e) => onChange({ aiStory: e.target.value })}
              rows={6}
              className={`${inputCls} resize-y`}
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block mb-2" style={labelStyle}>נקודות מרכזיות</label>
            <div className="space-y-2">
              {project.aiHighlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span style={{ color: 'var(--pb-accent)' }}>•</span>
                  <input
                    type="text"
                    value={h}
                    onChange={(e) => {
                      const updated = [...project.aiHighlights];
                      updated[i] = e.target.value;
                      onChange({ aiHighlights: updated });
                    }}
                    className="flex-1 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = project.aiHighlights.filter((_, idx) => idx !== i);
                      onChange({ aiHighlights: updated });
                    }}
                    className="transition-colors"
                    style={{ color: 'var(--pb-text2)' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => onChange({ aiHighlights: [...project.aiHighlights, ''] })}
                className="text-sm hover:underline mt-1"
                style={{ color: 'var(--pb-accent)' }}
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
