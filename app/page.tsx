import type { Metadata } from 'next'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export const metadata: Metadata = {
  title: 'PropBuilder — דף נחיתה מקצועי לנכס שלך',
  description: 'צרו דף נחיתה מרשים לנכס תוך דקות — בעברית מלאה, ללא קידוד, עם AI שכותב את הסיפור.',
  openGraph: {
    title: 'PropBuilder — דף נחיתה מקצועי לנכס שלך',
    description: 'צרו דף נחיתה מרשים לנכס תוך דקות — בעברית מלאה, ללא קידוד, עם AI שכותב את הסיפור.',
    type: 'website',
    locale: 'he_IL',
  },
}

const G = {
  bg:       'var(--pb-bg)',
  surface:  'var(--pb-surface)',
  surface2: 'var(--pb-surface2)',
  border:   'var(--pb-border)',
  text:     'var(--pb-text)',
  muted:    'var(--pb-text2)',
  gold:     'var(--pb-gold)',
  blue:     'var(--pb-accent)',
} as const

function MockCard() {
  return (
    <div className="relative select-none" dir="rtl">
      <div
        className="absolute inset-0 rounded-[28px]"
        style={{
          background: 'linear-gradient(160deg, #1c1826 0%, #100e18 100%)',
          border: '1px solid rgba(255,255,255,0.05)',
          transform: 'rotate(-4deg) scale(0.96) translateY(6px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          inset: '-50px',
          background: 'radial-gradient(ellipse at 50% 60%, rgba(212,168,83,0.13) 0%, transparent 60%)',
        }}
      />
      <div
        className="pb-float relative w-[300px] rounded-[28px] overflow-hidden"
        style={{
          background: 'linear-gradient(165deg, #191921 0%, #0e0e14 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 48px 96px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}
      >
        <div
          className="relative h-44 overflow-hidden"
          style={{ background: 'linear-gradient(150deg, #162a4a 0%, #1e4070 55%, #0d1e38 100%)' }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-20" style={{ background: 'linear-gradient(to top, rgba(14,14,20,0.95), transparent)' }} />
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(59,130,246,0.18)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.22)' }}>
              🏷️ למכירה
            </span>
          </div>
          <div className="absolute bottom-3 right-4">
            <p className="font-display text-[10px] tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.38)' }}>
              תל אביב · פלורנטין
            </p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <h3 className="font-display font-bold text-[15px] leading-snug text-white">דירת 4 חדרים עם נוף לים</h3>
          <p className="font-display font-bold text-[28px] leading-none" style={{ color: G.gold }}>₪2,500,000</p>
          <div className="flex flex-wrap gap-1.5">
            {['🏠 4 חדרים', '📐 90 מ״ר', '🏢 קומה 5', '🚗 חניה'].map(c => (
              <span key={c} className="text-[10px] px-2.5 py-1 rounded-full" style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {c}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center text-[11px] font-semibold py-2.5 rounded-xl" style={{ color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.09)' }}>📞 התקשר</div>
            <div className="text-center text-[11px] font-semibold py-2.5 rounded-xl text-white" style={{ background: 'linear-gradient(135deg, #22c55e, #15803d)' }}>💬 WhatsApp</div>
          </div>
        </div>
      </div>
    </div>
  )
}

const STEPS = [
  { n: '01', title: 'ממלאים פרטים',  desc: 'שם, כתובת, מחיר, תמונות — תוך דקה.' },
  { n: '02', title: 'AI כותב',        desc: 'כמה מילים — תיאור שיווקי מלא.' },
  { n: '03', title: 'בוחרים עיצוב',  desc: '5 תבניות מקצועיות לבחירה.' },
  { n: '04', title: 'שולחים לקונים', desc: 'קישור מוכן — ישירות מהווטסאפ.' },
]

const FEATURES = [
  { icon: '📋', title: 'ייבוא ממודעה', desc: 'הדביקו טקסט מיד2 או מדלן — פרטים ימולאו אוטומטית.' },
  { icon: '✨', title: 'AI מובנה',     desc: 'כותרת, תיאור ותגיות — הכל בשנייה אחת.' },
  { icon: '🎨', title: '5 תבניות',    desc: 'עיצובים מקצועיים לכל סגנון נכס.' },
  { icon: '🔗', title: 'קישור מיידי', desc: 'שלחו לקונים ולסוכנים — בלחיצה אחת.' },
]

export default function HomePage() {
  return (
    <div dir="rtl" lang="he" className="font-body" style={{ background: G.bg, color: G.text, minHeight: '100vh' }}>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 max-w-6xl mx-auto px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${G.border}`, backdropFilter: 'blur(20px)', background: 'color-mix(in srgb, var(--pb-bg) 92%, transparent)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: `linear-gradient(135deg, ${G.blue}, #1d4ed8)` }}>P</div>
          <span className="font-display font-bold text-base tracking-tight" style={{ color: G.text }}>Property Builder</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login?mode=commercial" className="text-sm font-medium hidden sm:block transition-colors" style={{ color: G.muted }}>
            כניסה לסוכנויות
          </Link>
          <ThemeToggle />
          <Link
            href="/builder"
            className="text-sm font-bold px-5 py-2.5 rounded-xl text-white transition-all"
            style={{ background: `linear-gradient(135deg, var(--pb-accent), #1d4ed8)`, boxShadow: '0 4px 16px rgba(37,99,235,0.35)' }}
          >
            התחילו עכשיו
          </Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden" style={{ background: G.bg }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />
        <div className="relative max-w-6xl mx-auto px-6 py-20 w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 lg:max-w-[560px]">
            <div className="pb-s1 inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-xs font-medium" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${G.border}`, color: G.muted }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.8)' }} />
              חינמי לחלוטין · AI מובנה · בעברית מלאה
            </div>
            <h1 className="pb-s2 font-display font-black leading-[1.05] mb-6" style={{ fontSize: 'clamp(2.8rem, 5.5vw, 4.4rem)', color: G.text }}>
              הנכס שלכם
              <br />
              <span style={{ color: G.gold }}>ראוי לדף</span>
              <br />
              שמוכר
            </h1>
            <p className="pb-s3 text-lg leading-relaxed mb-8" style={{ color: G.muted, maxWidth: '460px' }}>
              מוכרים דירה? משכירים? צרו דף נחיתה מקצועי תוך 5 דקות — ללא קוד, ללא עיצוב, חינם לגמרי.
            </p>
            <div className="pb-s4 flex flex-col sm:flex-row gap-3 mb-6">
              <Link
                href="/builder"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white transition-all"
                style={{ background: `linear-gradient(135deg, ${G.blue}, #1d4ed8)`, boxShadow: '0 8px 32px rgba(37,99,235,0.4)' }}
              >
                צרו דף עכשיו — חינם ←
              </Link>
            </div>
            <p className="pb-s5 text-sm" style={{ color: G.muted }}>ללא הרשמה · בעברית מלאה · מוכן לשיתוף בווטסאפ</p>
          </div>
          <div className="flex-shrink-0 hidden lg:flex justify-center">
            <MockCard />
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${G.border}`, borderBottom: `1px solid ${G.border}`, background: G.surface }}>
        <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { val: '5',  label: 'דקות ליצירה' },
            { val: '5',  label: 'תבניות עיצוב' },
            { val: 'AI', label: 'כותב בשבילכם' },
            { val: '₪0', label: 'עלות לשימוש' },
          ].map(s => (
            <div key={s.label}>
              <p className="font-display font-black text-3xl sm:text-4xl" style={{ color: G.gold }}>{s.val}</p>
              <p className="text-sm mt-1" style={{ color: G.muted }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── TWO TRACKS ───────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <p className="text-center text-xs font-bold tracking-widest uppercase mb-12" style={{ color: G.muted }}>
          מתאים לכל סוג עסקה
        </p>
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="rounded-3xl p-8 flex flex-col" style={{ background: 'linear-gradient(145deg, rgba(37,99,235,0.1) 0%, rgba(37,99,235,0.03) 100%)', border: '1px solid rgba(37,99,235,0.18)' }}>
            <div className="text-5xl mb-6">🏷️</div>
            <h3 className="font-display text-2xl font-bold mb-3" style={{ color: G.text }}>מוכרים נכס?</h3>
            <p className="text-sm leading-relaxed flex-1 mb-6" style={{ color: G.muted }}>
              דף נחיתה מלא עם תמונות, פרטים ותיאור שיווקי מ-AI — שולחים לקונים ישירות מהווטסאפ.
            </p>
            <Link href="/builder?type=sale" className="self-start px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all" style={{ background: 'rgba(37,99,235,0.85)' }}>
              צרו דף למכירה ←
            </Link>
          </div>
          <div className="rounded-3xl p-8 flex flex-col" style={{ background: 'linear-gradient(145deg, rgba(34,197,94,0.09) 0%, rgba(34,197,94,0.02) 100%)', border: '1px solid rgba(34,197,94,0.16)' }}>
            <div className="text-5xl mb-6">🔑</div>
            <h3 className="font-display text-2xl font-bold mb-3" style={{ color: G.text }}>משכירים נכס?</h3>
            <p className="text-sm leading-relaxed flex-1 mb-6" style={{ color: G.muted }}>
              הציגו את הדירה כמו שצריך — ריהוט, מחיר לחודש, פרטים מלאים — ללא עמלת תיווך.
            </p>
            <Link href="/builder?type=rent" className="self-start px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all" style={{ background: 'rgba(22,163,74,0.85)' }}>
              צרו דף להשכרה ←
            </Link>
          </div>
        </div>
      </section>

      {/* ── AGENCY TRACK ─────────────────────────────────────── */}
      <section style={{ background: G.surface, borderTop: `1px solid ${G.border}`, borderBottom: `1px solid ${G.border}` }}>
        <div className="max-w-5xl mx-auto px-6 py-16 flex flex-col sm:flex-row items-center gap-8">
          <div className="flex-1">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: G.muted }}>לסוכנויות נדל&quot;ן</p>
            <h2 className="font-display font-black text-2xl sm:text-3xl mb-3" style={{ color: G.text }}>ניהול מרכזי לכל הנכסים</h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: G.muted }}>
              מיתוג הסוכנות על כל הדפים · ניהול צוות סוכנים · מעקב לידים · אנליטיקס · ניסיון חינם ל-14 ימים.
            </p>
            <div className="flex gap-3">
              <Link href="/pricing" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all" style={{ background: G.blue }}>
                ראה מחירים ←
              </Link>
              <Link href="/auth/login?mode=commercial" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ border: `1px solid ${G.border}`, color: G.text }}>
                כניסה לחשבון
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            {['🏢 מיתוג מלא', '👥 ניהול צוות', '📬 מעקב לידים', '📊 אנליטיקס'].map(f => (
              <span key={f} className="px-4 py-2 rounded-full font-medium" style={{ background: G.surface2, color: G.text, border: `1px solid ${G.border}` }}>{f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: G.muted }}>התהליך</p>
            <h2 className="font-display font-black text-3xl sm:text-4xl" style={{ color: G.text }}>ארבעה שלבים</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ border: `1px solid ${G.border}`, borderRadius: '20px', overflow: 'hidden' }}>
            {STEPS.map((s, i) => (
              <div key={s.n} className="p-8" style={{ background: G.surface, borderRight: i < 3 ? `1px solid ${G.border}` : undefined }}>
                <p className="font-display font-black text-5xl mb-5 leading-none" style={{ color: i === 0 ? G.gold : G.border }}>
                  {s.n}
                </p>
                <h3 className="font-display font-bold text-base mb-2" style={{ color: G.text }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: G.muted }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-16">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: G.muted }}>יכולות</p>
          <h2 className="font-display font-black text-3xl sm:text-4xl" style={{ color: G.text }}>מה כלול</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="p-6 rounded-2xl flex flex-col gap-3 transition-all duration-200 hover:-translate-y-1" style={{ background: G.surface, border: `1px solid ${G.border}` }}>
              <div className="text-4xl">{f.icon}</div>
              <h3 className="font-display font-bold text-base" style={{ color: G.text }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: G.muted }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="relative py-28 px-6 text-center overflow-hidden" style={{ background: G.bg, borderTop: `1px solid ${G.border}` }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(212,168,83,0.07) 0%, transparent 60%)' }} />
        <div className="relative">
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: G.muted }}>מוכנים?</p>
          <h2 className="font-display font-black mb-4" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', color: G.gold }}>
            צרו דף שמוכר
          </h2>
          <p className="text-base mb-10 max-w-md mx-auto" style={{ color: G.muted }}>
            5 דקות. ללא קוד. דף מקצועי שאתם גאים לשלוח.
          </p>
          <Link
            href="/builder"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-lg font-bold text-white transition-all"
            style={{ background: `linear-gradient(135deg, ${G.blue}, #1d4ed8)`, boxShadow: '0 8px 40px rgba(37,99,235,0.4)' }}
          >
            התחילו עכשיו — חינם ←
          </Link>
          <p className="text-sm mt-5" style={{ color: G.muted }}>ללא הרשמה · בעברית מלאה</p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="text-center text-sm py-6" style={{ borderTop: `1px solid ${G.border}`, color: G.muted }}>
        <p>
          Property Builder · {new Date().getFullYear()} ·{' '}
          <Link href="/pricing" className="hover:underline transition-colors">מחירים לסוכנויות</Link>
          {' · '}
          <Link href="/terms" className="hover:underline transition-colors">תנאי שימוש</Link>
        </p>
      </footer>
    </div>
  )
}
