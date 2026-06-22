import type { Metadata } from 'next'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export const metadata: Metadata = {
  title: 'PropBuilder — דף נחיתה לנכס שלך',
  description: 'צרו דף נחיתה מקצועי לנכס תוך 5 דקות. עם AI, בעברית מלאה, ללא קוד.',
  openGraph: {
    title: 'PropBuilder — דף נחיתה לנכס שלך',
    description: 'צרו דף נחיתה מקצועי לנכס תוך 5 דקות. עם AI, בעברית מלאה, ללא קוד.',
    type: 'website',
    locale: 'he_IL',
  },
}

const INK = '#111'
const CREAM = '#f7f5f2'
const ACCENT = '#c0392b'

export default function HomePage() {
  return (
    <div dir="rtl" lang="he" className="font-body" style={{ background: CREAM, color: INK, minHeight: '100vh' }}>

      {/* ── NAV ──────────────────────────────────────────── */}
      <nav style={{ borderBottom: `2px solid ${INK}`, background: CREAM }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display font-black" style={{ fontSize: '1.1rem', letterSpacing: '-0.03em' }}>
            Prop<span style={{ color: ACCENT }}>Builder</span>
          </span>
          <div className="flex items-center gap-5">
            <Link href="/auth/login?mode=commercial" className="text-sm hidden sm:block" style={{ color: '#666' }}>
              לסוכנויות
            </Link>
            <ThemeToggle />
            <Link
              href="/builder"
              className="text-sm font-bold px-5 py-2.5 rounded-lg transition-[opacity,transform] hover:opacity-80 active:scale-[0.96]"
              style={{ background: INK, color: CREAM }}
            >
              בנו עכשיו ←
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <p className="text-xs font-bold uppercase tracking-widest mb-10" style={{ color: ACCENT }}>
          כלי בניית דפי נחיתה לנדל״ן
        </p>

        <h1
          className="font-display font-black mb-10"
          style={{
            fontSize: 'clamp(3rem, 8vw, 7.5rem)',
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
            maxWidth: '900px',
          }}
        >
          הבית שלך{' '}
          <span style={{ color: ACCENT }}>ראוי</span>{' '}
          לדף שמוכר
        </h1>

        <div style={{ width: '60px', height: '3px', background: INK, marginBottom: '32px' }} />

        <div className="flex flex-col sm:flex-row sm:items-end gap-8">
          <p className="text-lg leading-relaxed" style={{ color: '#444', maxWidth: '460px', lineHeight: 1.7 }}>
            תפסיקו לשלוח תמונות מיד2. צרו דף נחיתה מקצועי תוך 5 דקות — AI כותב, אתם שולחים.
          </p>
          <div className="flex-shrink-0 flex flex-col gap-2">
            <Link
              href="/builder"
              className="inline-flex items-center justify-center font-bold text-base px-8 py-4 rounded-lg transition-[opacity,transform] hover:opacity-85 active:scale-[0.96]"
              style={{ background: ACCENT, color: '#fff', whiteSpace: 'nowrap' }}
            >
              התחילו — חינם ←
            </Link>
            <p className="text-xs text-center" style={{ color: '#999' }}>ללא הרשמה · ללא קוד</p>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────── */}
      <div style={{ borderTop: `2px solid ${INK}`, borderBottom: `2px solid ${INK}`, background: INK }}>
        <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-3 text-center gap-4">
          {[
            { val: '5 דקות', label: 'מרישום לדף מוכן' },
            { val: '5 תבניות', label: 'מקצועיות לבחירה' },
            { val: 'חינם', label: 'לשימוש בסיסי' },
          ].map(s => (
            <div key={s.label}>
              <p className="font-display font-black text-2xl sm:text-3xl tabular-nums" style={{ color: CREAM, letterSpacing: '-0.02em' }}>{s.val}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(247,245,242,0.4)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── PROBLEM / SOLUTION ───────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-px" style={{ border: `2px solid ${INK}`, borderRadius: '12px', overflow: 'hidden' }}>
          <div className="p-10" style={{ background: '#eceae6' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-8" style={{ color: '#999' }}>
              מה כולם עושים
            </p>
            <ul className="space-y-5">
              {[
                'מעלים לאתר ומחכים שמישהו יראה',
                'שולחים צילום מסך בוואטסאפ',
                'כותבים "דירה יפה במיקום מצוין"',
                'מקווים שמישהו יתקשר',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-sm" style={{ color: '#888' }}>
                  <span className="mt-0.5 font-bold" style={{ color: '#ccc' }}>—</span>
                  <span style={{ textDecoration: 'line-through', textDecorationColor: '#ccc' }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-10" style={{ background: CREAM }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-8" style={{ color: ACCENT }}>
              מה אתם עושים עם PropBuilder
            </p>
            <ul className="space-y-5">
              {[
                'דף מקצועי עם תמונות, מחיר וסיפור',
                'קישור שאנשים שולחים הלאה',
                'תיאור AI שגורם לאנשים לרצות לבוא',
                'לידים ישירות אליכם — בלי עמלת תיווך',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-sm font-medium" style={{ color: INK }}>
                  <span className="mt-0.5 font-bold" style={{ color: ACCENT }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section style={{ borderTop: `2px solid ${INK}` }}>
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="flex items-baseline justify-between mb-12">
            <h2 className="font-display font-black text-3xl sm:text-4xl" style={{ letterSpacing: '-0.02em' }}>
              ארבעה שלבים
            </h2>
            <p className="text-sm" style={{ color: '#999' }}>לא ארבעים</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px" style={{ border: `2px solid ${INK}`, borderRadius: '8px', overflow: 'hidden' }}>
            {[
              { n: '01', title: 'פרטים', desc: 'כתובת, מחיר, תמונות — תוך דקה. אין טפסים ארוכים.' },
              { n: '02', title: 'AI כותב', desc: 'כמה מילים ממכם — תיאור שיווקי מלא. לא "דירה יפה".' },
              { n: '03', title: 'עיצוב', desc: '5 תבניות שעוצבו בנפרד. בוחרים, מסיימים.' },
              { n: '04', title: 'קישור', desc: 'לא תמונה. לא פוסט. קישור לדף שעובד — מהווטסאפ.' },
            ].map((s, i) => (
              <div
                key={s.n}
                className="p-8"
                style={{
                  background: i === 0 ? INK : CREAM,
                  borderLeft: i > 0 ? `2px solid ${INK}` : undefined,
                }}
              >
                <p
                  className="font-display font-black mb-4"
                  style={{ fontSize: '3rem', lineHeight: 1, color: i === 0 ? ACCENT : 'rgba(0,0,0,0.1)' }}
                >
                  {s.n}
                </p>
                <h3 className="font-display font-bold text-lg mb-2" style={{ color: i === 0 ? CREAM : INK }}>
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: i === 0 ? 'rgba(247,245,242,0.5)' : '#666' }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TWO TRACKS ───────────────────────────────────── */}
      <section style={{ borderTop: `2px solid ${INK}` }}>
        <div className="max-w-6xl mx-auto px-6 py-16">
          <p className="text-xs font-bold uppercase tracking-widest mb-10" style={{ color: '#999' }}>
            בשביל מה אתם כאן?
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                href: '/builder?type=sale',
                label: 'מוכרים?',
                desc: 'דף מקצועי עם תמונות, פרטים ותיאור AI שגורם לקונים לרצות לבוא לראות.',
                cta: 'בנו דף מכירה ←',
              },
              {
                href: '/builder?type=rent',
                label: 'משכירים?',
                desc: 'הציגו את הדירה בלי תיווך ובלי עמלות. ריהוט, מחיר, פרטי יצירת קשר ישירה.',
                cta: 'בנו דף השכרה ←',
              },
            ].map(t => (
              <Link
                key={t.href}
                href={t.href}
                className="block p-10 rounded-lg transition-[opacity,transform] hover:opacity-80 active:scale-[0.96]"
                style={{ background: '#eceae6', border: `2px solid ${INK}` }}
              >
                <h3 className="font-display font-black text-3xl mb-4" style={{ letterSpacing: '-0.02em' }}>{t.label}</h3>
                <p className="text-sm leading-relaxed mb-6" style={{ color: '#555' }}>{t.desc}</p>
                <span className="text-sm font-bold" style={{ color: ACCENT }}>{t.cta}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── AGENCY ───────────────────────────────────────── */}
      <section style={{ borderTop: `2px solid ${INK}`, background: INK }}>
        <div className="max-w-6xl mx-auto px-6 py-14 flex flex-col sm:flex-row items-start sm:items-center gap-8">
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: ACCENT }}>לסוכנויות נדל״ן</p>
            <h2
              className="font-display font-black mb-3"
              style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', letterSpacing: '-0.02em', color: CREAM }}
            >
              כל הנכסים שלכם. מותג אחד.
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(247,245,242,0.5)' }}>
              מיתוג הסוכנות על כל דף · ניהול צוות · מעקב לידים · יומן ביקורים · 14 ימי ניסיון חינם.
            </p>
            <div className="flex gap-3">
              <Link href="/pricing" className="px-5 py-2.5 rounded-lg text-sm font-bold transition-[opacity,transform] hover:opacity-85 active:scale-[0.96]" style={{ background: ACCENT, color: '#fff' }}>
                ראו מחירים ←
              </Link>
              <Link href="/auth/login?mode=commercial" className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-[opacity,transform] hover:opacity-70 active:scale-[0.96]" style={{ border: '1px solid rgba(247,245,242,0.2)', color: 'rgba(247,245,242,0.6)' }}>
                כניסה לחשבון
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {['מיתוג מלא', 'ניהול צוות', 'מעקב לידים', 'יומן ביקורים', 'תובנות'].map(f => (
              <span key={f} className="px-3 py-1.5 rounded-full" style={{ background: 'rgba(247,245,242,0.07)', color: 'rgba(247,245,242,0.5)', border: '1px solid rgba(247,245,242,0.1)' }}>
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section style={{ borderTop: `2px solid ${INK}` }}>
        <div className="max-w-6xl mx-auto px-6 py-24 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#aaa' }}>מוכנים?</p>
            <h2
              className="font-display font-black"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 5.5rem)', letterSpacing: '-0.03em', lineHeight: 0.95 }}
            >
              5 דקות.
              <br />
              <span style={{ color: ACCENT }}>דף שמוכר.</span>
            </h2>
          </div>
          <div className="flex-shrink-0 flex flex-col items-start gap-3">
            <Link
              href="/builder"
              className="inline-flex items-center font-bold text-lg px-10 py-4 rounded-lg transition-[opacity,transform] hover:opacity-85 active:scale-[0.96]"
              style={{ background: INK, color: CREAM }}
            >
              התחילו עכשיו — חינם ←
            </Link>
            <p className="text-xs" style={{ color: '#aaa' }}>ללא הרשמה · ללא קוד · בעברית מלאה</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer style={{ borderTop: `2px solid ${INK}` }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4 text-xs" style={{ color: '#aaa' }}>
          <span className="font-display font-black" style={{ color: INK, letterSpacing: '-0.02em' }}>
            Prop<span style={{ color: ACCENT }}>Builder</span>
          </span>
          <div className="flex flex-wrap gap-5">
            <span>© {new Date().getFullYear()}</span>
            <Link href="/pricing" className="hover:text-black transition-colors">מחירים</Link>
            <Link href="/terms" className="hover:text-black transition-colors">תנאי שימוש</Link>
            <a href="https://hadarsap.online" target="_blank" rel="noopener" className="hover:text-black transition-colors" dir="ltr">hadarsap.online</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
