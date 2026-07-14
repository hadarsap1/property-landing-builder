import type { Metadata } from 'next';
import Link from 'next/link';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'הצהרת נגישות | Property Landing Builder',
  description: 'הצהרת הנגישות של שירות Property Landing Builder',
};

const LAST_UPDATED = '2026-07-14';

export default function AccessibilityPage() {
  return (
    <div dir="rtl" lang="he" className="min-h-screen bg-gray-50">
      <nav className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
          <span className="text-xl">🏠</span>
          <span className="font-semibold">Property Landing Builder</span>
        </Link>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
          ← חזרה לדף הראשי
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pb-20 pt-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 sm:p-10">

          <h1 className="text-3xl font-bold text-gray-900 mb-2">הצהרת נגישות</h1>
          <p className="text-sm text-gray-400 mb-8">עודכן לאחרונה: {LAST_UPDATED}</p>

          <div className="space-y-8 text-gray-700 leading-relaxed">

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">מחויבות לנגישות</h2>
              <p>
                {LEGAL.businessName} רואה חשיבות רבה בהנגשת השירות לאנשים עם מוגבלות, מתוך
                מחויבות לשוויון זכויות ובהתאם לחוק שוויון זכויות לאנשים עם מוגבלות, התשנ״ח-1998,
                תקנות הנגישות לשירות ותקן ישראלי 5568 (בהתבסס על הנחיות WCAG 2.0 ברמה AA).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">התאמות הנגישות באתר</h2>
              <ul className="list-disc list-inside space-y-1 text-gray-600 mr-4">
                <li>ניווט מלא באמצעות מקלדת (Tab / Shift+Tab / Enter) עם סימון פוקוס נראה.</li>
                <li>תמיכה בקוראי מסך: מבנה כותרות תקין, טקסט חלופי לתמונות ותוויות לשדות טופס.</li>
                <li>רכיב נגישות בדפי הנחיתה: הגדלת טקסט, ניגודיות מוגברת, הדגשת קישורים ועצירת אנימציות.</li>
                <li>גלריות מתחלפות ניתנות לעצירה בלחיצת כפתור.</li>
                <li>שמירה על יחסי ניגודיות של 4.5:1 לפחות בטקסטים.</li>
                <li>האתר מותאם לתצוגה במכשירים ניידים ולשינוי גודל תצוגה עד 200%.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">חשוב לדעת — דפי נחיתה של מפרסמים</h2>
              <p>
                חלק מהתכנים בדפי הנחיתה (תמונות, תיאורים ופרטי נכסים) מועלים על ידי הסוכנויות
                והמתווכים המשתמשים בשירות. אנו מספקים להם את הכלים לפרסום נגיש, ופועלים לשיפור
                מתמיד. אם נתקלת בתוכן שאינו נגיש — נשמח לדעת ולתקן.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">רכז/ת הנגישות</h2>
              <p>
                לכל שאלה, בעיה או בקשה בנושא נגישות ניתן לפנות אל רכז/ת הנגישות של השירות:
              </p>
              <ul className="list-none space-y-1 text-gray-600 mr-4 mt-2">
                <li><strong>שם:</strong> {LEGAL.accessibilityCoordinator}</li>
                <li><strong>מייל:</strong> <a href={`mailto:${LEGAL.contactEmail}`} className="text-blue-600 hover:underline" dir="ltr">{LEGAL.contactEmail}</a></li>
              </ul>
              <p className="mt-2">
                נשתדל להשיב לפניות בנושא נגישות בתוך 48 שעות ולתקן ליקויים בהקדם האפשרי.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">הסדרי נגישות נוספים</h2>
              <p>
                השירות הוא מקוון בלבד ואין לו סניפים פיזיים. ההצהרה תעודכן ככל שיבוצעו שינויים
                מהותיים באתר או בהתאמות הנגישות.
              </p>
            </section>

          </div>

          <div className="mt-10 pt-6 border-t border-gray-100 text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/terms" className="text-blue-600 hover:underline">תנאי שימוש</Link>
            <Link href="/privacy" className="text-blue-600 hover:underline">מדיניות פרטיות</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
