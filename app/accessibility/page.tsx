import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'הצהרת נגישות — PropBuilder',
  description: 'הצהרת הנגישות של PropBuilder לפי תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), תשע״ג-2013',
}

/**
 * Published accessibility statement.
 *
 * Regulation 35 of the Equal Rights for Persons with Disabilities
 * (Accessibility Adjustments to Service) Regulations 5773-2013 requires an
 * accessibility statement to be published on the site, covering the level of
 * conformance, known limitations, and how to report a problem.
 *
 * The placeholders below (contact details, coordinator, dates) must be filled
 * in by the operator — they are business facts, not something the code knows.
 */
export default function AccessibilityPage() {
  const updated = '31 ביולי 2026'

  return (
    <main className="min-h-screen bg-white py-12 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-blue-700 hover:underline text-sm">← חזרה לדף הבית</Link>

        <h1 className="text-3xl font-bold mt-6 mb-2">הצהרת נגישות</h1>
        <p className="text-gray-600 text-sm mb-8">עדכון אחרון: {updated}</p>

        <section className="space-y-6 text-gray-800 leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">המחויבות שלנו</h2>
            <p>
              אנו רואים חשיבות רבה במתן שירות שוויוני לכלל המשתמשים, ופועלים להנגיש את האתר
              לאנשים עם מוגבלות בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות, תשנ״ח-1998
              ולתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), תשע״ג-2013.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">רמת הנגישות באתר</h2>
            <p>
              האתר הונגש בהתאם לתקן הישראלי ת״י 5568, המבוסס על הנחיות{' '}
              <a
                href="https://www.w3.org/TR/WCAG20/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline"
              >
                WCAG 2.0
              </a>{' '}
              של ארגון W3C, ברמת התאמה AA.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">מה הונגש באתר</h2>
            <ul className="list-disc pr-6 space-y-1">
              <li>ניווט מלא באמצעות מקלדת בכל חלקי האתר, עם סימון ברור של מוקד ההקלדה</li>
              <li>קישור ״דלג לתוכן הראשי״ בתחילת כל עמוד</li>
              <li>הגדרת שפה וכיווניות (עברית, מימין לשמאל) ברמת המסמך</li>
              <li>טקסט חלופי לתמונות</li>
              <li>תוויות מפורשות לשדות טפסים</li>
              <li>ניגודיות צבעים העומדת ביחס של 4.5:1 לפחות עבור טקסט רגיל</li>
              <li>כיבוד העדפת מערכת ההפעלה להפחתת אנימציות</li>
              <li>מבנה כותרות היררכי ותגיות סמנטיות</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">מגבלות ידועות</h2>
            <p>
              דפי הנכסים באתר נבנים על ידי המשתמשים, והם הבוחרים את התמונות, הצבעים והתכנים.
              לכן ייתכנו בדפים מסוימים תכנים שאינם עומדים במלוא דרישות הנגישות — למשל תיאור
              חלופי שלא הוזן, או שילוב צבעים בעל ניגודיות נמוכה. אנו פועלים לצמצם זאת
              באמצעות ברירות מחדל נגישות בכלי הבנייה.
            </p>
            <p className="mt-2">
              אם נתקלתם בתוכן שאינו נגיש, נשמח שתדווחו לנו ונפעל לתקנו.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">פנייה בנושא נגישות</h2>
            <p>
              נתקלתם בבעיית נגישות? נשמח לשמוע. אנא פרטו את העמוד שבו נתקלתם בבעיה, את סוג
              הדפדפן וטכנולוגיית הסיוע שבה אתם משתמשים, ואת מהות התקלה — כדי שנוכל לטפל במהירות.
            </p>
            <div className="mt-3 rounded-lg border border-gray-300 bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">רכז/ת הנגישות</p>
              {/* TODO(operator): replace with the real coordinator details before publishing. */}
              <p className="mt-1">שם: [יש להשלים]</p>
              <p>
                דוא״ל:{' '}
                <a href="mailto:hadarsap@gmail.com" className="text-blue-700 underline">
                  hadarsap@gmail.com
                </a>
              </p>
              <p>טלפון: [יש להשלים]</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">הסדרי נגישות נוספים</h2>
            <p>
              השירות ניתן באופן מקוון בלבד ואינו כולל מקום פיזי המספק שירות לציבור.
              ככל שיתווסף שירות פיזי, הצהרה זו תעודכן בהתאם.
            </p>
          </div>
        </section>

        <div className="mt-10 pt-6 border-t border-gray-300 text-sm text-gray-600">
          <Link href="/terms" className="text-blue-700 hover:underline">תנאי שימוש</Link>
          {' · '}
          <Link href="/privacy" className="text-blue-700 hover:underline">מדיניות פרטיות</Link>
        </div>
      </div>
    </main>
  )
}
