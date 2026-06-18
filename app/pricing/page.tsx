import type { Metadata } from 'next'
import Link from 'next/link'
import { PLANS, PLAN_TRIAL_DAYS } from '@/lib/billing/config'

export const metadata: Metadata = {
  title: 'מחירים — PropBuilder',
  description: 'תכנית חודשית ושנתית לסוכנויות נדל"ן. ניסיון חינם ללא כרטיס אשראי.',
}

const FEATURES = [
  'דפי נחיתה ממותגים לכל הנכסים',
  'מיתוג מלא — לוגו, צבעים, כתובת ייחודית',
  'ניהול צוות סוכנים ללא הגבלה',
  'מעקב לידים ופייפליין מכירות',
  'ניהול יומן ביקורים',
  'תובנות חכמות על ביצועי הדפים',
  'עורך AI לתיאורים שיווקיים',
  'פורטל מוכר לעדכונים ישירים',
  'הודעות מייל על לידים חדשים',
  'תמיכה בעברית מלאה',
]

export default function PricingPage() {
  const { monthly, yearly } = PLANS
  const monthlyFromYearly = Math.round(yearly.priceIls / 12)

  return (
    <div dir="rtl" lang="he" className="min-h-screen" style={{ background: '#f7f5f2' }}>

      <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg flex items-center gap-2" style={{ color: '#111' }}>
          <span className="text-2xl">🏠</span>
          PropBuilder
        </Link>
        <Link
          href="/auth/login?mode=commercial"
          className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          style={{ color: '#888' }}
        >
          כניסה
        </Link>
      </nav>

      <section className="max-w-3xl mx-auto px-6 pt-12 pb-8 text-center">
        <div
          className="inline-block text-sm font-semibold px-4 py-1.5 rounded-full mb-6"
          style={{ background: '#fff', border: '2px solid #111', color: '#111' }}
        >
          ניסיון חינם ל-{PLAN_TRIAL_DAYS} ימים · ללא כרטיס אשראי
        </div>
        <h1 className="text-4xl font-extrabold mb-4" style={{ color: '#111' }}>מחירים פשוטים ושקופים</h1>
        <p className="text-lg" style={{ color: '#888' }}>תכנית אחת לסוכנויות. כל הפיצ&apos;רים. ביטול בכל עת.</p>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-2 gap-6">

          {/* Monthly */}
          <div className="rounded-3xl p-8 flex flex-col" style={{ background: '#fff', border: '2px solid #111' }}>
            <div className="text-sm font-semibold mb-3" style={{ color: '#888' }}>חיוב חודשי</div>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-5xl font-extrabold" style={{ color: '#111' }}>
                ₪{monthly.priceIls.toLocaleString('he-IL')}
              </span>
              <span className="mb-2 text-lg" style={{ color: '#aaa' }}>/ חודש</span>
            </div>
            <div className="h-16 flex flex-col justify-end mb-6">
              <p className="text-sm" style={{ color: '#aaa' }}>מתחדש אוטומטית · ביטול בכל עת</p>
            </div>
            <Link
              href="/auth/register"
              className="block w-full text-center font-bold px-6 py-3.5 rounded-2xl text-sm transition-colors mb-8"
              style={{ background: '#111', color: '#f7f5f2' }}
            >
              התחל ניסיון חינם ←
            </Link>
            <ul className="space-y-3 flex-1">
              {FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: '#888' }}>
                  <span className="font-bold mt-0.5 shrink-0" style={{ color: '#c0392b' }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Yearly — recommended */}
          <div className="rounded-3xl p-8 relative flex flex-col" style={{ background: '#111', border: '2px solid #111' }}>
            <div className="absolute -top-3.5 right-6 text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: '#c0392b', color: '#fff' }}>
              חסכון של {yearly.savingPct}%
            </div>
            <div className="text-sm font-semibold mb-3" style={{ color: '#aaa' }}>חיוב שנתי</div>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-5xl font-extrabold" style={{ color: '#f7f5f2' }}>₪{yearly.priceIls.toLocaleString('he-IL')}</span>
              <span className="mb-2 text-lg" style={{ color: '#aaa' }}>/ שנה</span>
            </div>
            <div className="h-16 flex flex-col justify-end mb-6">
              <p className="text-sm font-medium" style={{ color: '#f7f5f2' }}>שווה ל-₪{monthlyFromYearly} לחודש</p>
              <p className="text-sm" style={{ color: '#aaa' }}>תשלום אחד לשנה שלמה</p>
            </div>
            <Link
              href="/auth/register"
              className="block w-full text-center font-bold px-6 py-3.5 rounded-2xl text-sm transition-colors mb-8"
              style={{ background: '#c0392b', color: '#fff' }}
            >
              התחל ניסיון חינם ←
            </Link>
            <ul className="space-y-3 flex-1">
              {FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: '#aaa' }}>
                  <span className="font-bold mt-0.5 shrink-0" style={{ color: '#c0392b' }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 text-center space-y-2">
          <p className="text-sm font-medium" style={{ color: '#888' }}>ביטול והחזרות</p>
          <p className="text-sm max-w-xl mx-auto leading-relaxed" style={{ color: '#aaa' }}>
            ניתן לבטל את המנוי בכל עת מדף ההגדרות. הגישה נשמרת עד סוף תקופת החיוב הנוכחית.
            אין החזר כספי על תקופות חיוב שכבר החלו, אלא אם נקבע אחרת על פי חוק.
            לניסיון חינם — לא יחויב כרטיס אשראי עד תום הניסיון.
          </p>
          <p className="text-sm" style={{ color: '#aaa' }}>
            שאלות?{' '}
            <a
              href="mailto:support@propbuilder.co.il"
              className="hover:underline"
              style={{ color: '#c0392b' }}
            >
              support@propbuilder.co.il
            </a>
          </p>
          <p className="text-xs mt-4" style={{ color: '#ccc' }}>
            PropBuilder · מדיניות פרטיות:{' '}
            <a href="/privacy" className="hover:underline">propbuilder.co.il/privacy</a>
            {' · '}
            <a href="/terms" className="hover:underline">תנאי שימוש</a>
          </p>
        </div>
      </section>
    </div>
  )
}
