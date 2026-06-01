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
  'אנליטיקס ומדידת ביצועים',
  'עורך AI לתיאורים שיווקיים',
  'פורטל מוכר לעדכונים ישירים',
  'הודעות מייל על לידים חדשים',
  'תמיכה בעברית מלאה',
]

export default function PricingPage() {
  const { monthly, yearly } = PLANS
  const monthlyFromYearly = Math.round(yearly.priceIls / 12)

  return (
    <div dir="rtl" lang="he" className="min-h-screen bg-gradient-to-b from-slate-50 to-white">

      <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="font-bold text-gray-900 text-lg flex items-center gap-2">
          <span className="text-2xl">🏠</span>
          PropBuilder
        </Link>
        <Link
          href="/auth/login?mode=commercial"
          className="text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          כניסה
        </Link>
      </nav>

      <section className="max-w-3xl mx-auto px-6 pt-12 pb-8 text-center">
        <div className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
          ניסיון חינם ל-{PLAN_TRIAL_DAYS} ימים · ללא כרטיס אשראי
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">מחירים פשוטים ושקופים</h1>
        <p className="text-lg text-gray-500">תכנית אחת לסוכנויות. כל הפיצ'רים. ביטול בכל עת.</p>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-2 gap-6">

          {/* Monthly */}
          <div className="bg-white rounded-3xl border-2 border-gray-200 hover:border-gray-300 p-8 transition-colors flex flex-col">
            <div className="text-sm font-semibold text-gray-500 mb-3">חיוב חודשי</div>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-5xl font-extrabold text-gray-900">
                ₪{monthly.priceIls.toLocaleString('he-IL')}
              </span>
              <span className="text-gray-400 mb-2 text-lg">/ חודש</span>
            </div>
            <div className="min-h-[3.5rem]">
              <p className="text-sm text-gray-400">מתחדש אוטומטית · ביטול בכל עת</p>
            </div>
            <Link
              href="/auth/register"
              className="block w-full text-center bg-gray-900 hover:bg-gray-700 text-white font-bold px-6 py-3.5 rounded-2xl text-sm transition-colors mb-8"
            >
              התחל ניסיון חינם ←
            </Link>
            <ul className="space-y-3 flex-1">
              {FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <span className="text-green-500 font-bold mt-0.5 shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Yearly — recommended */}
          <div className="bg-gradient-to-b from-blue-600 to-blue-700 rounded-3xl border-2 border-blue-500 p-8 text-white relative shadow-xl shadow-blue-200 flex flex-col">
            <div className="absolute -top-3.5 right-6 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1.5 rounded-full shadow">
              חסכון של {yearly.savingPct}%
            </div>
            <div className="text-sm font-semibold text-blue-200 mb-3">חיוב שנתי</div>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-5xl font-extrabold">₪{yearly.priceIls.toLocaleString('he-IL')}</span>
              <span className="text-blue-200 mb-2 text-lg">/ שנה</span>
            </div>
            <div className="min-h-[3.5rem]">
              <p className="text-sm text-blue-100 font-medium">
                שווה ל-₪{monthlyFromYearly} לחודש
              </p>
              <p className="text-sm text-blue-200">תשלום אחד לשנה שלמה</p>
            </div>
            <Link
              href="/auth/register"
              className="block w-full text-center bg-white hover:bg-blue-50 text-blue-700 font-bold px-6 py-3.5 rounded-2xl text-sm transition-colors mb-8"
            >
              התחל ניסיון חינם ←
            </Link>
            <ul className="space-y-3 flex-1">
              {FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-blue-100">
                  <span className="text-blue-200 font-bold mt-0.5 shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-10">
          שאלות? נשמח לעזור.{' '}
          <a
            href={`mailto:${process.env.SUPER_ADMIN_EMAIL ?? 'info@propbuilder.co.il'}`}
            className="text-blue-600 hover:underline"
          >
            צור קשר
          </a>
        </p>
      </section>
    </div>
  )
}
