import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'מדיניות פרטיות — PropBuilder',
  description: 'מדיניות הפרטיות של PropBuilder',
}

export default function PrivacyPage() {
  const updated = '1 ביוני 2026'

  return (
    <main className="min-h-screen bg-white py-12 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto prose prose-gray">
        <Link href="/" className="text-blue-600 hover:underline text-sm">← חזרה לדף הבית</Link>

        <h1 className="text-3xl font-bold mt-6 mb-2">מדיניות פרטיות</h1>
        <p className="text-gray-500 text-sm mb-8">עדכון אחרון: {updated}</p>

        <section className="space-y-6 text-gray-700 leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. כללי</h2>
            <p>
              PropBuilder (&quot;השירות&quot;, &quot;אנחנו&quot;) מפעיל פלטפורמה לבניית דפי נחיתה לנכסי נדל&quot;ן.
              מדיניות פרטיות זו מפרטת כיצד אנו אוספים, משתמשים ושומרים מידע אישי בהתאם לחוק הגנת הפרטיות, תשמ&quot;א-1981
              ותקנותיו, וכן לתקנות GDPR ככל שרלוונטיות.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">2. מידע שאנו אוספים</h2>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>משתמשים רשומים:</strong> שם, כתובת מייל, תמונת פרופיל (מ-Google), שם סוכנות.</li>
              <li><strong>מבקרים בדפי נכסים:</strong> שם, טלפון ומייל שמוזנים בטופס יצירת קשר.</li>
              <li><strong>נתוני שימוש:</strong> כתובת IP, סוג דפדפן, עמודים שנצפו, מקור הפניה (referrer), זמן ביקור.</li>
              <li><strong>עוגיות (Cookies):</strong> עוגיית session לצורך אימות, ועוגיות אנליטיקה (Vercel Analytics).</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">3. מטרות השימוש במידע</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>הפעלת השירות ואימות משתמשים.</li>
              <li>העברת פניות מבקרים (לידים) לסוכן/בעל הנכס הרלוונטי.</li>
              <li>שיפור השירות וניתוח שימוש אנונימי.</li>
              <li>שליחת עדכוני שירות ואימיילים עסקיים חיוניים.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. שיתוף מידע</h2>
            <p>
              אנו <strong>לא מוכרים</strong> מידע אישי לצדדים שלישיים.
              מידע שנאסף בטפסי יצירת קשר מועבר אך ורק לסוכן/בעל הנכס שאליו פנה המבקר.
              ספקי תשתית (Vercel, Neon, Stripe) עשויים לעבד מידע כחלק מהפעלת השירות, בהתאם למדיניויות הפרטיות שלהם.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. עוגיות ומעקב</h2>
            <p>
              השירות משתמש בעוגיות הכרחיות לצורך אימות ואבטחה.
              בנוסף, אנו משתמשים ב-Vercel Analytics לניתוח תנועה אנונימית — ללא מעקב אחר פרטים מזהים.
              תוכל לחסום עוגיות דרך הגדרות הדפדפן שלך; הדבר עשוי לפגוע בחלק מפונקציונליות השירות.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">6. עוזר AI (צ&apos;אט)</h2>
            <p>
              דפי הנכסים כוללים עוזר שאלות ותשובות המופעל על ידי בינה מלאכותית (Anthropic Claude).
              שאלות שתשאל יועברו לשירות Anthropic לצורך יצירת תשובה — הן <strong>אינן</strong> משמשות לאימון מודלים.
              אל תשתף במסגרת הצ&apos;אט מידע אישי רגיש.
              תשובות העוזר הן אינפורמטיביות בלבד ואינן מהוות ייעוץ מקצועי.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">7. אחסון ואבטחה</h2>
            <p>
              המידע מאוחסן בשרתים מוצפנים (Neon Postgres / Vercel) בתקנים תעשייתיים.
              אנו מיישמים בקרות גישה, הצפנה בתעבורה (TLS) ואמצעי אבטחה סבירים אחרים.
              עם זאת, אין אבטחה מוחלטת — בקרות אבטחה מפחיתות סיכון אך אינן מבטלות אותו.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">8. שמירת מידע</h2>
            <p>
              מידע חשבון נשמר כל עוד החשבון פעיל.
              לידים (פניות מבקרים) נשמרים עד 24 חודשים לאחר הגשתם.
              נתוני אנליטיקה נשמרים עד 12 חודשים.
              ניתן לבקש מחיקת מידע בכל עת (ראה סעיף 9).
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">9. זכויותיך</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>זכות עיון — לקבל עותק של המידע האישי שלנו לגביך.</li>
              <li>זכות תיקון — לדרוש תיקון מידע שגוי.</li>
              <li>זכות מחיקה — לדרוש מחיקת חשבונך ונתוניך.</li>
              <li>זכות התנגדות — להתנגד לעיבוד מידע לצרכי שיווק.</li>
            </ul>
            <p className="mt-2">
              לממש את זכויותיך, פנה אלינו בכתב לכתובת:{' '}
              <a href="mailto:privacy@propbuilder.co.il" className="text-blue-600 hover:underline">
                privacy@propbuilder.co.il
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">10. פרטי התקשרות</h2>
            <p>
              PropBuilder<br />
              לשאלות ובקשות הקשורות לפרטיות:{' '}
              <a href="mailto:privacy@propbuilder.co.il" className="text-blue-600 hover:underline">
                privacy@propbuilder.co.il
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">11. שינויים במדיניות</h2>
            <p>
              אנו עשויים לעדכן מדיניות זו מעת לעת.
              שינויים מהותיים יפורסמו בשירות ו/או יישלחו במייל לפחות 14 יום לפני כניסתם לתוקף.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
