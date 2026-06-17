import type { Metadata } from 'next'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export const metadata: Metadata = {
  title: 'PropBuilder — הדירה שלך לא צריכה עוד מודעה ביד2',
  description: 'צרו דף נחיתה שאנשים זוכרים — לא עוד צילום מסך. תוך 5 דקות, בעברית מלאה, עם AI.',
  openGraph: {
    title: 'PropBuilder — הדירה שלך לא צריכה עוד מודעה ביד2',
    description: 'צרו דף נחיתה שאנשים זוכרים — לא עוד צילום מסך. תוך 5 דקות, בעברית מלאה, עם AI.',
    type: 'website',
    locale: 'he_IL',
  },
}

const STEPS = [
  {
    n: '01',
    title: 'מלאו את הפרטים',
    desc: 'כתובת, מחיר, תמונות. תוך דקה.',
    aside: 'אין טפסים של 40 שדות.',
  },
  {
    n: '02',
    title: 'AI כותב בשבילכם',
    desc: 'כמה מילים ממכם — תיאור שיווקי מלא ממנו.',
    aside: 'לא עוד "דירה יפה במיקום מצוין".',
  },
  {
    n: '03',
    title: 'בחרו עיצוב',
    desc: '5 תבניות מקצועיות. לא "5 גרסאות של אותו הדבר".',
    aside: 'כל אחת עוצבה בנפרד.',
  },
  {
    n: '04',
    title: 'שלחו קישור',
    desc: 'לא תמונה. לא פוסט. קישור לדף שעובד.',
    aside: 'ישירות מהווטסאפ.',
  },
]

export default function HomePage() {
  return (
    <div
      dir="rtl"
      lang="he"
      className="font-body"
      style={{
        background: '#080808',
        color: '#f0ede8',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >

      {/* ── NAV ────────────────────────────────────────────── */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          background: 'rgba(8,8,8,0.88)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <span
            className="font-display font-black tracking-tighter"
            style={{ fontSize: '1.15rem', color: '#f0ede8', letterSpacing: '-0.04em' }}
          >
            Prop<span style={{ color: '#ff5500' }}>Builder</span>
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login?mode=commercial"
              className="text-sm hidden sm:block transition-opacity hover:opacity-60"
              style={{ color: 'rgba(240,237,232,0.45)' }}
            >
              לסוכנויות
            </Link>
            <ThemeToggle />
            <Link
              href="/builder"
              className="text-sm font-bold px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
              style={{
                background: '#ff5500',
                color: '#080808',
              }}
            >
              בנו עכשיו
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section
        style={{
          minHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 0 60px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background grain texture */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '200px',
            pointerEvents: 'none',
          }}
        />

        {/* Accent glow */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '10%',
            left: '-10%',
            width: '60vw',
            height: '60vw',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(255,85,0,0.08) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 w-full">

          {/* Overline */}
          <p
            className="font-body text-sm font-semibold mb-8"
            style={{
              color: '#ff5500',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            לא עוד מודעה ביד2
          </p>

          {/* Giant headline */}
          <h1
            className="font-display font-black leading-none mb-8"
            style={{
              fontSize: 'clamp(3.2rem, 9vw, 8.5rem)',
              letterSpacing: '-0.03em',
              lineHeight: 0.93,
              color: '#f0ede8',
            }}
          >
            הדירה שלך
            <br />
            <span
              style={{
                color: 'transparent',
                WebkitTextStroke: '2px #ff5500',
              }}
            >
              ראויה לדף
            </span>
            <br />
            שאנשים זוכרים
          </h1>

          {/* Sub */}
          <p
            className="text-lg leading-relaxed mb-12"
            style={{
              color: 'rgba(240,237,232,0.55)',
              maxWidth: '520px',
              lineHeight: 1.7,
            }}
          >
            תפסיקו לשלוח צילומי מסך ממודעות.
            {' '}צרו דף נחיתה מקצועי תוך 5 דקות — עם AI שכותב, תבניות שמרשימות, וקישור שפשוט עובד.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Link
              href="/builder"
              className="inline-flex items-center gap-3 font-bold text-base px-8 py-4 rounded-2xl transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{
                background: '#ff5500',
                color: '#080808',
                boxShadow: '0 0 40px rgba(255,85,0,0.3)',
              }}
            >
              בנו את הדף שלכם — חינם ←
            </Link>
            <p
              className="text-sm self-center"
              style={{ color: 'rgba(240,237,232,0.3)' }}
            >
              ללא הרשמה · ללא קוד · בעברית מלאה
            </p>
          </div>

          {/* Horizontal rule with stat */}
          <div
            className="mt-20 pt-8 grid grid-cols-3 gap-8 sm:max-w-lg"
            style={{ borderTop: '1px solid rgba(255,255,255,0.09)' }}
          >
            {[
              { val: '5', unit: 'דקות', label: 'מהרישום לדף מוכן' },
              { val: '5', unit: 'תבניות', label: 'עוצבו בנפרד' },
              { val: '₪0', unit: '', label: 'לשימוש בסיסי' },
            ].map(s => (
              <div key={s.label}>
                <p
                  className="font-display font-black"
                  style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#ff5500', lineHeight: 1 }}
                >
                  {s.val}
                  {s.unit && (
                    <span className="text-base font-bold ml-1" style={{ color: 'rgba(240,237,232,0.5)' }}>
                      {' '}{s.unit}
                    </span>
                  )}
                </p>
                <p className="text-xs mt-1.5" style={{ color: 'rgba(240,237,232,0.4)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BREAK SECTION ─── "מה כולם שולחים vs מה אתם יכולים" */}
      <section
        style={{
          borderTop: '1px solid rgba(255,255,255,0.07)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '80px 0',
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-4 items-stretch">

            {/* Left — The problem */}
            <div
              style={{
                borderRadius: '20px',
                padding: '48px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <p
                className="text-xs font-bold tracking-widest uppercase mb-6"
                style={{ color: 'rgba(240,237,232,0.3)' }}
              >
                מה כולם עושים
              </p>
              <div className="space-y-4">
                {[
                  'מעלים את הדירה ליד2 ומחכים',
                  'שולחים צילום מסך בוואטסאפ',
                  'כותבים "דירה יפה במיקום מצוין"',
                  'מקווים שמישהו יתקשר',
                ].map(item => (
                  <div
                    key={item}
                    className="flex items-center gap-4 text-sm"
                    style={{ color: 'rgba(240,237,232,0.4)' }}
                  >
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(240,237,232,0.3)' }}
                    >
                      ✕
                    </span>
                    <span style={{ textDecoration: 'line-through', textDecorationColor: 'rgba(255,255,255,0.2)' }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — The solution */}
            <div
              style={{
                borderRadius: '20px',
                padding: '48px',
                background: 'rgba(232,255,71,0.04)',
                border: '1px solid rgba(255,85,0,0.25)',
              }}
            >
              <p
                className="text-xs font-bold tracking-widest uppercase mb-6"
                style={{ color: '#ff5500' }}
              >
                מה אתם עושים עם PropBuilder
              </p>
              <div className="space-y-4">
                {[
                  'דף נחיתה מקצועי עם תמונות וסיפור',
                  'קישור שאנשים שולחים הלאה',
                  'AI שכותב תיאור שגורם לאנשים לרצות לבוא',
                  'לידים ישירות אליכם — בלי תיווך',
                ].map(item => (
                  <div
                    key={item}
                    className="flex items-center gap-4 text-sm font-medium"
                    style={{ color: 'rgba(240,237,232,0.85)' }}
                  >
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: '#ff5500', color: '#080808' }}
                    >
                      ✓
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section style={{ padding: '100px 0' }}>
        <div className="max-w-7xl mx-auto px-6">

          {/* Section label — big & left-aligned */}
          <div className="mb-16">
            <p
              className="text-xs font-bold tracking-widest uppercase mb-4"
              style={{ color: 'rgba(240,237,232,0.3)' }}
            >
              התהליך
            </p>
            <h2
              className="font-display font-black"
              style={{
                fontSize: 'clamp(2.4rem, 5vw, 4.5rem)',
                letterSpacing: '-0.03em',
                lineHeight: 0.95,
                color: '#f0ede8',
              }}
            >
              ארבעה שלבים.
              <br />
              <span style={{ color: 'rgba(240,237,232,0.25)' }}>לא ארבעים.</span>
            </h2>
          </div>

          {/* Steps — staggered layout */}
          <div className="space-y-px" style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className="group flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10 p-8 transition-colors duration-200 hover:bg-white/[0.025]"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderBottom: i < STEPS.length - 1 ? '1px solid rgba(255,255,255,0.07)' : undefined,
                }}
              >
                {/* Number */}
                <p
                  className="font-display font-black flex-shrink-0"
                  style={{
                    fontSize: 'clamp(3rem, 5vw, 4.5rem)',
                    lineHeight: 1,
                    color: i === 0 ? '#ff5500' : 'rgba(255,255,255,0.08)',
                    transition: 'color 200ms',
                    width: '90px',
                  }}
                >
                  {s.n}
                </p>

                {/* Title + desc */}
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-display font-bold text-xl mb-1"
                    style={{ color: '#f0ede8' }}
                  >
                    {s.title}
                  </h3>
                  <p className="text-sm" style={{ color: 'rgba(240,237,232,0.5)' }}>{s.desc}</p>
                </div>

                {/* Aside */}
                <p
                  className="text-xs italic flex-shrink-0 hidden lg:block"
                  style={{ color: 'rgba(240,237,232,0.25)', maxWidth: '160px', textAlign: 'left' }}
                >
                  {s.aside}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TWO TRACKS ────────────────────────────────────── */}
      <section
        style={{
          padding: '80px 0',
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <p
            className="text-xs font-bold tracking-widest uppercase mb-12"
            style={{ color: 'rgba(240,237,232,0.3)' }}
          >
            בשביל מה אתם כאן?
          </p>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Sale */}
            <Link
              href="/builder?type=sale"
              className="group block rounded-3xl p-10 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.09)',
              }}
            >
              <p
                className="font-display font-black mb-4"
                style={{ fontSize: '3.5rem', lineHeight: 1 }}
              >
                🏷️
              </p>
              <h3
                className="font-display font-black text-2xl mb-3"
                style={{ color: '#f0ede8', letterSpacing: '-0.02em' }}
              >
                מוכרים?
              </h3>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: 'rgba(240,237,232,0.45)' }}
              >
                דף שמציג את הנכס כמו שהוא ראוי — עם סיפור, תמונות, ומחיר שרואים. לא מודעה. דף.
              </p>
              <span
                className="inline-flex items-center gap-2 text-sm font-bold transition-colors"
                style={{ color: '#ff5500' }}
              >
                בנו דף מכירה ←
              </span>
            </Link>

            {/* Rent */}
            <Link
              href="/builder?type=rent"
              className="group block rounded-3xl p-10 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.09)',
              }}
            >
              <p
                className="font-display font-black mb-4"
                style={{ fontSize: '3.5rem', lineHeight: 1 }}
              >
                🔑
              </p>
              <h3
                className="font-display font-black text-2xl mb-3"
                style={{ color: '#f0ede8', letterSpacing: '-0.02em' }}
              >
                משכירים?
              </h3>
              <p
                className="text-sm leading-relaxed mb-6"
                style={{ color: 'rgba(240,237,232,0.45)' }}
              >
                הציגו את הדירה בלי תיווך ובלי עמלות — פרטים מלאים, ריהוט, מחיר לחודש, ויצירת קשר ישירה.
              </p>
              <span
                className="inline-flex items-center gap-2 text-sm font-bold transition-colors"
                style={{ color: '#ff5500' }}
              >
                בנו דף השכרה ←
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── AGENCY STRIP ──────────────────────────────────── */}
      <section
        style={{
          margin: '0 24px 60px',
          borderRadius: '24px',
          padding: '56px 48px',
          background: 'rgba(232,255,71,0.05)',
          border: '1px solid rgba(255,85,0,0.2)',
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-8">
          <div className="flex-1">
            <p
              className="text-xs font-bold tracking-widest uppercase mb-3"
              style={{ color: '#ff5500' }}
            >
              לסוכנויות נדל״ן
            </p>
            <h2
              className="font-display font-black mb-3"
              style={{
                fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
                letterSpacing: '-0.02em',
                color: '#f0ede8',
              }}
            >
              כל הנכסים שלכם. מותג אחד. לוח ניהול אחד.
            </h2>
            <p
              className="text-sm leading-relaxed mb-6"
              style={{ color: 'rgba(240,237,232,0.5)' }}
            >
              מיתוג הסוכנות על כל דף · ניהול צוות סוכנים · מעקב לידים ויומן ביקורים · 14 ימי ניסיון חינם, ללא כרטיס אשראי.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className="px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: '#ff5500', color: '#080808' }}
              >
                ראו מחירים ←
              </Link>
              <Link
                href="/auth/login?mode=commercial"
                className="px-6 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(240,237,232,0.6)' }}
              >
                כניסה לחשבון
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {['מיתוג מלא', 'ניהול צוות', 'מעקב לידים', 'יומן ביקורים', 'תובנות חכמות'].map(f => (
              <span
                key={f}
                className="px-3 py-1.5 rounded-full font-medium"
                style={{
                  background: 'rgba(255,85,0,0.08)',
                  color: 'rgba(255,115,50,0.8)',
                  border: '1px solid rgba(255,85,0,0.2)',
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────── */}
      <section
        style={{
          padding: '120px 24px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Glow bg */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '70vw',
            height: '40vw',
            background: 'radial-gradient(ellipse, rgba(255,85,0,0.08) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />
        <div className="relative max-w-3xl mx-auto">
          <p
            className="text-xs font-bold tracking-widest uppercase mb-6"
            style={{ color: 'rgba(240,237,232,0.3)' }}
          >
            אז מה מחכים?
          </p>
          <h2
            className="font-display font-black mb-6"
            style={{
              fontSize: 'clamp(2.8rem, 7vw, 6rem)',
              letterSpacing: '-0.03em',
              lineHeight: 0.95,
              color: '#f0ede8',
            }}
          >
            5 דקות.
            <br />
            <span style={{ color: '#ff5500' }}>דף שמוכר.</span>
          </h2>
          <p
            className="text-base mb-10"
            style={{ color: 'rgba(240,237,232,0.4)', maxWidth: '380px', margin: '0 auto 40px' }}
          >
            לא צריך מעצב, לא צריך מתכנת, לא צריך להירשם. רק להתחיל.
          </p>
          <Link
            href="/builder"
            className="inline-flex items-center gap-3 font-bold text-lg px-10 py-5 rounded-2xl transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{
              background: '#ff5500',
              color: '#080808',
              boxShadow: '0 0 60px rgba(255,85,0,0.35)',
            }}
          >
            בנו את הדף שלכם — חינם ←
          </Link>
          <p
            className="text-sm mt-5"
            style={{ color: 'rgba(240,237,232,0.25)' }}
          >
            ללא הרשמה · ללא קוד · בעברית מלאה
          </p>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer
        className="text-xs py-6 px-6"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)', color: 'rgba(240,237,232,0.25)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <span className="font-display font-black tracking-tighter" style={{ fontSize: '0.95rem', color: 'rgba(240,237,232,0.4)' }}>
            Prop<span style={{ color: 'rgba(232,255,71,0.5)' }}>Builder</span>
          </span>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span>© {new Date().getFullYear()}</span>
            <Link href="/pricing" className="hover:text-white/60 transition-colors">מחירים לסוכנויות</Link>
            <Link href="/terms" className="hover:text-white/60 transition-colors">תנאי שימוש</Link>
            <a href="https://hadarsap.online" target="_blank" rel="noopener" className="hover:text-white/60 transition-colors" dir="ltr">
              hadarsap.online
            </a>
          </div>
        </div>
      </footer>

    </div>
  )
}
