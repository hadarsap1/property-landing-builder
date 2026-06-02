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

export default function Step3({ project, onChange, agencyId }: StepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה לא צפויה');
    } finally {
      setLoading(false);
    }
  }

  function appendWord(word: string) {
    const current = project.rawStory.trim();
    const separator = current.length > 0 && !current.endsWith(',') && !current.endsWith('.') ? ', ' : ' ';
    onChange({ rawStory: current + separator + word });
  }

  const hasAIContent = project.aiStory || project.aiTitle;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">הסיפור של הנכס</h2>

      {/* Raw story textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ספרו לנו על הנכס במילים שלכם
        </label>
        <textarea
          value={project.rawStory}
          onChange={(e) => onChange({ rawStory: e.target.value })}
          rows={5}
          placeholder="כתבו כאן בחופשיות — מה הדבר הכי מיוחד? מה יש בשכונה? מה אהבתם בדירה?"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      {/* Word bank */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          השראה — לחצו על מילה להוסיף לטקסט
        </p>
        <div className="space-y-2">
          {WORD_BANK.map((cat) => {
            const isOpen = openCategory === cat.label;
            return (
              <div key={cat.label} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenCategory(isOpen ? null : cat.label)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
                >
                  <span>{cat.label}</span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-3 py-2 flex flex-wrap gap-2 bg-white">
                    {cat.words.map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => appendWord(w)}
                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full transition-colors"
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

      {/* Chat AI extras */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-start gap-3 mb-2">
          <span className="text-2xl shrink-0">🤖</span>
          <div>
            <label className="block text-sm font-semibold text-gray-800">
              מידע נוסף ל-AI Chat
            </label>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              הוסף כאן עובדות שמבקרים בדף שואלים — ארנונה, ועד בית, תחבורה ציבורית, בתי ספר באזור, מצב הבניין, ועוד.
              ה-AI ישתמש במידע הזה כדי לענות במדויק על שאלות בצ&#39;אט הצף.
            </p>
          </div>
        </div>
        <textarea
          value={project.chatQA ?? ''}
          onChange={(e) => onChange({ chatQA: e.target.value })}
          rows={6}
          placeholder={`לדוגמה:\n• ארנונה חודשית: ~450 ₪\n• ועד בית: 280 ₪ (כולל ניקיון ולובי)\n• 3 דקות הליכה מתחנת הרכבת הקלה\n• בית ספר יסודי "אחד העם" — 5 דק' הליכה\n• הבניין משנת 1998, עבר חיזוק תמ"א 38\n• מותר חיות מחמד`}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-sm whitespace-pre-line"
        />
        <p className="text-xs text-gray-400 mt-1.5">
          טיפ: כתוב כל עובדה בשורה נפרדת. ככל שתוסיף יותר פרטים, ה-AI יוכל לענות לקונים בצורה מדויקת ובלי שתצטרך לחזור על אותן שאלות.
        </p>
      </div>

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
