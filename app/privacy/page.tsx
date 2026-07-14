import type { Metadata } from 'next';
import Link from 'next/link';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'מדיניות פרטיות | Property Landing Builder',
  description: 'מדיניות הפרטיות של שירות Property Landing Builder',
};

const LAST_UPDATED = LEGAL.privacyPolicyVersion;

export default function PrivacyPage() {
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

          <h1 className="text-3xl font-bold text-gray-900 mb-2">מדיניות פרטיות</h1>
          <p className="text-sm text-gray-400 mb-8">עודכן לאחרונה: {LAST_UPDATED}</p>

          <div className="space-y-8 text-gray-700 leading-relaxed">

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">1. כללי</h2>
              <p>
                {LEGAL.businessName} (&quot;השירות&quot;) מכבד את פרטיות המשתמשים ופועל בהתאם לחוק
                הגנת הפרטיות, התשמ״א-1981, לרבות תיקון 13. מדיניות זו מסבירה איזה מידע אנחנו
                אוספים, לאיזו מטרה, מה נעשה בו, ומהן זכויותיך. השימוש בשירות מהווה הסכמה
                למדיניות זו.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">2. איזה מידע נאסף — ומדוע</h2>
              <p className="mb-2 font-medium text-gray-800">א. מתעניינים בנכס (מבקרים בדפי נחיתה):</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 mr-4 mb-4">
                <li><strong>שם, טלפון ומייל</strong> — רק אם מילאת את טופס יצירת הקשר. המידע מועבר לסוכנות/למתווך שפרסמו את הנכס, לצורך חזרה אליך בלבד.</li>
                <li><strong>נתוני שימוש אנונימיים</strong> — צפיות בדף, לחיצות על כפתורי קשר ומזהה ביקור אקראי, לצורך סטטיסטיקה למפרסם הנכס. דפי הנחיתה עצמם אינם שותלים עוגיות מעקב.</li>
              </ul>
              <p className="mb-2 font-medium text-gray-800">ב. סוכנויות ומתווכים (בעלי חשבון):</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 mr-4">
                <li><strong>פרטי חשבון</strong> — שם, מייל, סיסמה מוצפנת או מזהה חשבון Google, שם הסוכנות וטלפון.</li>
                <li><strong>תוכן שהעלית</strong> — פרטי נכסים, תמונות ופרטי קשר המוצגים בדפים שיצרת.</li>
                <li><strong>פרטי חיוב</strong> — מנוהלים אצל ספק הסליקה; פרטי כרטיס אשראי אינם נשמרים אצלנו.</li>
                <li><strong>נתוני שימוש</strong> — אנליטיקה תפעולית (Vercel Analytics) ועוגיות הנדרשות להתחברות.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">3. עוגיות (Cookies)</h2>
              <p>
                באזורים הדורשים התחברות (לוח בקרה, אשף הבנייה) נעשה שימוש בעוגיות חיוניות לניהול
                החיבור (session) ובאחסון מקומי להעדפות תצוגה. בדפי הנחיתה הציבוריים לא מוצבות
                עוגיות מעקב או פיקסלים פרסומיים.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">4. שיתוף מידע עם צדדים שלישיים</h2>
              <p className="mb-2">המידע אינו נמכר ואינו מועבר לצדדים שלישיים, למעט:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 mr-4">
                <li>הסוכנות/המתווך שפרסמו את הנכס — מקבלים את הפרטים שמילאת בטופס.</li>
                <li>ספקי תשתית החיוניים להפעלת השירות: אחסון ואנליטיקה (Vercel), מסד נתונים, שליחת מייל, סליקה, ושירות ה-AI ליצירת טקסטים שיווקיים (Anthropic — מקבל את פרטי הנכס בלבד, לא פרטי מתעניינים).</li>
                <li>כאשר קיימת חובה על פי דין.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">5. דיוור שיווקי</h2>
              <p>
                דיוור שיווקי יישלח רק למי שסימן/ה הסכמה מפורשת ונפרדת לכך (תיקון 40 לחוק
                התקשורת). ההסכמה מתועדת (מועד, מקור וגרסת מדיניות) וניתן להסיר אותה בכל עת
                בפנייה אלינו או באמצעות קישור ההסרה שבכל הודעה. אי-סימון ההסכמה אינו פוגע
                באפשרות שהסוכנות תחזור אליך בעניין הפנייה עצמה.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">6. אבטחת מידע ושמירת נתונים</h2>
              <p>
                המידע נשמר במסד נתונים מאובטח, התקשורת מוצפנת (HTTPS), הגישה לפרטי מתעניינים
                מוגבלת לסוכנות הרלוונטית בלבד, וסיסמאות נשמרות מוצפנות. המידע נשמר כל עוד הוא
                נדרש למטרות שלשמן נאסף, או עד לבקשת מחיקה.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">7. הזכויות שלך</h2>
              <p>
                הינך זכאי/ת לעיין במידע שנאסף עליך, לבקש תיקון או מחיקה שלו, ולמשוך הסכמה לדיוור.
                לכל בקשה או שאלה בענייני פרטיות: <a href={`mailto:${LEGAL.contactEmail}`} className="text-blue-600 hover:underline" dir="ltr">{LEGAL.contactEmail}</a>.
                נשיב לפניות בהקדם ולא יאוחר מהקבוע בדין.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">8. שינויים במדיניות</h2>
              <p>
                מדיניות זו עשויה להתעדכן מעת לעת; המשך שימוש בשירות לאחר עדכון מהווה הסכמה
                לנוסח המעודכן. הנוסח המחייב הוא זה המפורסם בעמוד זה.
              </p>
            </section>

          </div>

          <div className="mt-10 pt-6 border-t border-gray-100 text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/terms" className="text-blue-600 hover:underline">תנאי שימוש</Link>
            <Link href="/accessibility" className="text-blue-600 hover:underline">הצהרת נגישות</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
