import Link from 'next/link';

const FEATURES = [
  {
    icon: '📋',
    title: 'ייבוא ממודעה',
    desc: 'הדביקו טקסט מיד2, מדלן או כל מודעה אחרת — הפרטים יימולאו אוטומטית.',
  },
  {
    icon: '✨',
    title: 'סיפור בעזרת AI',
    desc: 'כתבו כמה מילים על הנכס, ה-AI ינסח טקסט שיווקי חם ומשכנע.',
  },
  {
    icon: '🎨',
    title: '5 תבניות עיצוב',
    desc: 'Modern Blue, Dark Luxury, Warm Homey ועוד — בחרו את העיצוב שמתאים לנכס.',
  },
  {
    icon: '🔗',
    title: 'קישור לשיתוף',
    desc: 'קוד גישה בן 6 ספרות — שלחו לקונים פוטנציאליים, לסוכנים, לכל מי שצריך.',
  },
];

export default function HomePage() {
  return (
    <div dir="rtl" lang="he" className="min-h-screen bg-gradient-to-b from-blue-50 to-white">

      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏠</span>
          <span className="font-bold text-gray-900 text-lg">Property Landing Builder</span>
        </div>
        <Link
          href="/builder"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          התחל עכשיו
        </Link>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
          חינמי לשימוש · ללא קידוד · בעברית מלאה
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
          דף נחיתה מקצועי
          <br />
          <span className="text-blue-600">לנכס שלך תוך דקות</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          ממלאים פרטים, בוחרים עיצוב, ה-AI כותב את הסיפור.
          תוצאה: דף נחיתה מקצועי שתשלחו לכל קונה פוטנציאלי — תוך פחות מ-5 דקות.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/builder"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-10 py-4 rounded-xl text-lg transition-colors shadow-lg shadow-blue-200"
          >
            צרו דף עכשיו — חינם ←
          </Link>
          <a
            href="#features"
            className="border-2 border-gray-200 hover:border-gray-300 text-gray-600 font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
          >
            גלו עוד ↓
          </a>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section id="features" className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA bottom ────────────────────────────────────────── */}
      <section className="bg-blue-600 py-16 px-6 text-center text-white">
        <h2 className="text-3xl font-bold mb-3">מוכנים להתחיל?</h2>
        <p className="text-blue-100 mb-8 text-lg">לוקח פחות מ-5 דקות. חינם לחלוטין.</p>
        <Link
          href="/builder"
          className="bg-white text-blue-600 font-bold px-10 py-4 rounded-xl text-lg hover:bg-blue-50 transition-colors shadow-lg"
        >
          צרו דף נחיתה עכשיו ←
        </Link>
      </section>

      <footer className="text-center text-sm text-gray-400 py-6 space-y-1">
        <p>Property Landing Builder · {new Date().getFullYear()}</p>
        <p>
          <Link href="/terms" className="hover:text-gray-600 underline underline-offset-2 transition-colors">
            תנאי שימוש
          </Link>
        </p>
      </footer>
    </div>
  );
}
