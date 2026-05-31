import type { Metadata } from 'next'
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'PropBuilder — דף נחיתה מקצועי לנכס שלך',
  description: 'צור דף נחיתה מרשים לנכס בדקות — בעברית מלאה, ללא קידוד, עם AI שכותב את הסיפור.',
  openGraph: {
    title: 'PropBuilder — דף נחיתה מקצועי לנכס שלך',
    description: 'צור דף נחיתה מרשים לנכס בדקות — בעברית מלאה, ללא קידוד, עם AI שכותב את הסיפור.',
    type: 'website',
    locale: 'he_IL',
  },
}

const PERSONAL_FEATURES = [
  { icon: '📋', text: 'ייבוא ממודעה קיימת (יד2, מדלן)' },
  { icon: '✨', text: 'כתיבת סיפור עם AI' },
  { icon: '🔗', text: 'קישור לשיתוף מיידי' },
  { icon: '🆓', text: 'חינמי לגמרי' },
]

const COMMERCIAL_FEATURES = [
  { icon: '🏢', text: 'מיתוג הסוכנות על כל הדפים' },
  { icon: '👥', text: 'ניהול צוות סוכנים' },
  { icon: '📬', text: 'מעקב לידים ויצירת קשר' },
  { icon: '📊', text: 'אנליטיקס ומדידה' },
]

export default function HomePage() {
  return (
    <div dir="rtl" lang="he" className="min-h-screen bg-gradient-to-b from-slate-50 to-white">

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏠</span>
          <span className="font-bold text-gray-900 text-lg">PropBuilder</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            כניסה
          </Link>
          <Link
            href="/builder"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            התחל עכשיו
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pt-14 pb-8 text-center">
        <div className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
          ללא קידוד · בעברית מלאה · תוך דקות
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
          דף נחיתה מקצועי
          <br />
          <span className="text-blue-600">לנכס שלך</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          ויזרד פשוט, AI שכותב את הסיפור, עיצוב מרשים — בין אם אתה מוכר דירה פרטית
          או מנהל סוכנות נדל&quot;ן.
        </p>
      </section>

      {/* ── Two CTAs ────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-2 gap-6">

          {/* Personal track */}
          <div className="bg-white rounded-3xl border-2 border-gray-100 hover:border-blue-200 p-8 shadow-sm hover:shadow-md transition-all group">
            <div className="text-4xl mb-4">🏡</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">מוכר דירה פרטית</h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              יחיד שמוכר נכס? צור דף מקצועי בחינם, שתף עם קונים פוטנציאליים — ללא ניסיון טכני.
            </p>
            <ul className="space-y-2 mb-8">
              {PERSONAL_FEATURES.map((f) => (
                <li key={f.text} className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{f.icon}</span>
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/builder"
              className="block w-full text-center bg-blue-600 group-hover:bg-blue-700 text-white font-bold px-6 py-3.5 rounded-2xl text-sm transition-colors"
            >
              צור דף עכשיו — חינם ←
            </Link>
          </div>

          {/* Commercial track */}
          <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-3xl border-2 border-gray-700 hover:border-blue-500 p-8 shadow-sm hover:shadow-md transition-all group">
            <div className="text-4xl mb-4">🏢</div>
            <h2 className="text-xl font-bold text-white mb-2">מתווך / סוכן נדל&quot;ן</h2>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              ניהול מרכזי לכל הנכסים, מיתוג הסוכנות, ניהול צוות ולידים — הכל במקום אחד.
            </p>
            <ul className="space-y-2 mb-8">
              {COMMERCIAL_FEATURES.map((f) => (
                <li key={f.text} className="flex items-center gap-2 text-sm text-gray-300">
                  <span>{f.icon}</span>
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/pricing"
              className="block w-full text-center bg-white group-hover:bg-blue-50 text-gray-900 font-bold px-6 py-3.5 rounded-2xl text-sm transition-colors mb-3"
            >
              ראה מחירים ←
            </Link>
            <Link
              href="/auth/login?mode=commercial"
              className="block w-full text-center text-gray-400 hover:text-gray-200 text-xs transition-colors py-1"
            >
              כבר יש לי חשבון
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">איך זה עובד?</h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            { step: '1', icon: '✏️', title: 'מלא פרטים', desc: 'ויזרד פשוט בן 9 שלבים — עיר, מחיר, תמונות ועוד' },
            { step: '2', icon: '✨', title: 'AI כותב', desc: 'ה-AI מייצר כותרת, תגית ותיאור שיווקי ממה שמסרת' },
            { step: '3', icon: '🔗', title: 'שתף', desc: 'קבל קישור ושלח לכל קונה פוטנציאלי' },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl mx-auto mb-4">{s.icon}</div>
              <div className="text-xs font-bold text-blue-600 mb-1">שלב {s.step}</div>
              <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────────── */}
      <section className="bg-blue-600 py-16 px-6 text-center text-white">
        <h2 className="text-3xl font-bold mb-3">מוכן להתחיל?</h2>
        <p className="text-blue-100 mb-8 text-lg">לוקח פחות מ-5 דקות.</p>
        <Link
          href="/builder"
          className="bg-white text-blue-600 font-bold px-10 py-4 rounded-xl text-lg hover:bg-blue-50 transition-colors shadow-lg"
        >
          צור דף הנחיתה שלך — חינם ←
        </Link>
      </section>

      <footer className="text-center text-sm text-gray-400 py-6">
        PropBuilder · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
