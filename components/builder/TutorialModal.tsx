'use client';

import { useState } from 'react';

interface Slide {
  icon: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    icon: '🏠',
    title: 'ברוכים הבאים!',
    body: 'בכמה דקות ניצור יחד דף נחיתה מקצועי לנכס שלכם — בלי קוד ובלי מעצב. הנה איך זה עובד.',
  },
  {
    icon: '📋',
    title: 'ממלאים פרטים',
    body: 'אפשר להדביק מודעה קיימת (יד2 / מדלן) והשדות יתמלאו לבד, או להזין ידנית שלב אחרי שלב. הכל נשמר אוטומטית.',
  },
  {
    icon: '✨',
    title: 'ה-AI כותב בשבילכם',
    body: 'כותבים כמה מילים על הנכס — וה-AI מנסח כותרת, תיאור שיווקי ונקודות מכירה. אפשר לערוך הכל.',
  },
  {
    icon: '🔗',
    title: 'שומרים ומשתפים',
    body: 'בסוף תקבלו קישור וקוד 6 ספרות לשליחה בוואטסאפ. וכשהנכס נמכר או הושכר — מסמנים זאת בקליק מ"הנכסים שלי", והדף יתעדכן אוטומטית.',
  },
];

export default function TutorialModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [i, setI] = useState(0);
  if (!open) return null;

  const slide = SLIDES[i];
  const isLast = i === SLIDES.length - 1;

  function finish() {
    setI(0);
    onClose();
  }

  return (
    <div
      dir="rtl"
      lang="he"
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={finish}
      role="dialog"
      aria-modal="true"
      aria-label="מדריך התחלה"
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--pb-surface)', border: '1px solid var(--pb-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-7 text-center">
          <div className="text-5xl mb-4">{slide.icon}</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--pb-text)' }}>
            {slide.title}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--pb-text2)' }}>
            {slide.body}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {SLIDES.map((_, idx) => (
            <span
              key={idx}
              className="w-2 h-2 rounded-full transition-colors"
              style={{ background: idx === i ? 'var(--pb-accent)' : 'var(--pb-border)' }}
            />
          ))}
        </div>

        {/* Controls */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: '1px solid var(--pb-border)' }}
        >
          <button
            type="button"
            onClick={finish}
            className="text-sm font-medium"
            style={{ color: 'var(--pb-text2)' }}
          >
            דלג
          </button>

          <div className="flex items-center gap-2">
            {i > 0 && (
              <button
                type="button"
                onClick={() => setI((n) => n - 1)}
                className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                style={{ background: 'var(--pb-surface2)', color: 'var(--pb-text)' }}
              >
                הקודם
              </button>
            )}
            <button
              type="button"
              onClick={() => (isLast ? finish() : setI((n) => n + 1))}
              className="text-sm font-semibold px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              {isLast ? 'בואו נתחיל!' : 'הבא'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
