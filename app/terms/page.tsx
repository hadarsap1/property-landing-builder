import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'תנאי שימוש | Property Landing Builder',
  description: 'תנאי השימוש בשירות Property Landing Builder',
};

const LAST_UPDATED = '2025-05-25';

export default function TermsPage() {
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

          <h1 className="text-3xl font-bold text-gray-900 mb-2">תנאי שימוש</h1>
          <p className="text-sm text-gray-400 mb-8">עודכן לאחרונה: {LAST_UPDATED}</p>

          <div className="space-y-8 text-gray-700 leading-relaxed">

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">1. כללי</h2>
              <p>
                Property Landing Builder ("השירות") הוא כלי מקוון ליצירת דפי נחיתה לנכסי נדל"ן.
                השימוש בשירות מהווה הסכמה לתנאים המפורטים להלן.
                אם אינך מסכים לתנאים, אנא הפסק להשתמש בשירות.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">2. השימוש המותר</h2>
              <p className="mb-2">
                השירות מיועד לשימוש חוקי בלבד, לצורך יצירת ופרסום מידע על נכסי נדל"ן.
                המשתמש מתחייב:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 ms-4">
                <li>לפרסם מידע אמיתי ומדויק על הנכס</li>
                <li>לא לפרסם תוכן מטעה, שקרי או פוגעני</li>
                <li>לא להשתמש בשירות לפעולות בלתי חוקיות</li>
                <li>לא לנסות לפרוץ, להטעין עומס יתר, או לשבש את השירות</li>
                <li>לא להשתמש בשירות לספאם או פרסום המוני ללא הסכמה</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">3. תוכן שיווקי שנוצר על ידי AI</h2>
              <p>
                השירות משתמש בינה מלאכותית (Anthropic Claude) לצורך יצירת תיאורי נכסים ותוכן שיווקי.
                התוכן שנוצר מסופק "כמות שהוא" ויתכנו בו אי דיוקים.
                האחריות לבדיקת התוכן ולדיוקו מוטלת על המשתמש בלבד.
                השירות אינו מהווה ייעוץ משפטי, פיננסי, שמאי, או מקצועי מכל סוג שהוא.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">4. אחריות המשתמש לתוכן</h2>
              <p>
                המשתמש אחראי באופן בלעדי לכל תוכן שהוא מעלה, מזין, או מפרסם דרך השירות,
                לרבות תמונות, תיאורים, פרטי קשר, ומחירים.
                בעל השירות אינו אחראי לנזקים שייגרמו לצד שלישי כלשהו כתוצאה מתוכן שיצר המשתמש.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">5. שמירת נתונים ופרטיות</h2>
              <p className="mb-2">
                הנתונים שהמשתמש מזין לאשף נשמרים בדפדפן (localStorage) בלבד, אלא אם המשתמש בחר לשמור את הפרויקט
                ולקבל קישור שיתוף. במקרה של שמירה:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 ms-4">
                <li>הנתונים, לרבות תמונות ופרטי הנכס, נשמרים בשרתי השירות עד 90 יום</li>
                <li>לאחר 90 יום הנתונים נמחקים אוטומטית</li>
                <li>אין אימות משתמשים, ולכן יש לשמור את קוד הגישה בסודיות</li>
                <li>לא נעשה שימוש בנתונים לצורכי שיווק, פרסום, או מכירה לצד שלישי</li>
              </ul>
              <p className="mt-2">
                אנא אל תזין פרטים רגישים שאינם הכרחיים לצורך פרסום הנכס.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">6. קניין רוחני</h2>
              <p>
                התמונות, הטקסטים, ופרטי הנכס שהמשתמש מעלה הם קניינו בלבד.
                השירות אינו רוכש כל זכות בתוכן שיצר המשתמש.
                עיצוב השירות, הקוד, ותבניות הדפים הם קניין בעל השירות.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">7. הגבלת אחריות</h2>
              <p className="mb-2">
                השירות מסופק "כמות שהוא", ללא כל אחריות מפורשת או משתמעת.
                בעל השירות לא יהיה אחראי בגין:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 ms-4">
                <li>נזק ישיר, עקיף, מקרי, או תוצאתי הנובע משימוש בשירות</li>
                <li>אובדן נתונים, הכנסה, או רווח</li>
                <li>שגיאות בתוכן שנוצר על ידי AI</li>
                <li>הפסקת שירות, תקלות טכניות, או פגיעה בזמינות</li>
                <li>שימוש של צד שלישי בקישור השיתוף שיצר המשתמש</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">8. זמינות השירות</h2>
              <p>
                בעל השירות שומר לעצמו את הזכות לשנות, להשעות, או להפסיק את השירות בכל עת וללא הודעה מוקדמת.
                אין התחייבות לזמינות רציפה או לשמירת נתונים לתמיד.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">9. שינויים בתנאים</h2>
              <p>
                בעל השירות רשאי לעדכן תנאים אלה בכל עת.
                המשך השימוש בשירות לאחר פרסום שינויים מהווה הסכמה לתנאים המעודכנים.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">10. דין חל</h2>
              <p>
                תנאים אלה כפופים לדין הישראלי.
                כל מחלוקת תידון בבית המשפט המוסמך במחוז תל אביב.
              </p>
            </section>

          </div>
        </div>
      </main>

      <footer className="text-center text-sm text-gray-400 py-6">
        <Link href="/" className="hover:text-gray-600 transition-colors">
          Property Landing Builder
        </Link>
      </footer>
    </div>
  );
}
