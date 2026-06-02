'use client'

import { useState } from 'react'
import Link from 'next/link'

type Item = { q: string; a: string }

const SECTIONS: { id: string; icon: string; title: string; items: Item[] }[] = [
  {
    id: 'start',
    icon: '🚀',
    title: 'התחלה',
    items: [
      {
        q: 'איך מתחילים?',
        a: 'אחרי הכניסה עם Google, לחץ "+ נכס חדש" ומלא את פרטי הנכס שלך. PropBuilder יצור עבורך עמוד ייחודי ועוצמתי שאפשר לשתף ברשתות חברתיות, וואטסאפ, ויד2.',
      },
      {
        q: 'האם צריך לשלם?',
        a: 'לא! עבור מוכרים פרטיים השירות חינמי לחלוטין. תוכל ליצור עמוד נכס, לשתף אותו ולקבל פניות — ללא עלות.',
      },
      {
        q: 'האם הנתונים שלי מאובטחים?',
        a: 'כן. אנחנו משתמשים בהתחברות Google מאובטחת. לא שומרים סיסמאות. הנכס שלך גלוי רק למי שיש לו את הקישור — הדף אינו מאונדקס בגוגל אוטומטית.',
      },
    ],
  },
  {
    id: 'listing',
    icon: '🏠',
    title: 'עמוד הנכס',
    items: [
      {
        q: 'איך יוצרים עמוד נכס?',
        a: 'לחץ "+ נכס חדש" ← מלא פרטים (כתובת, מחיר, תיאור, מספר חדרים) ← שמור. לאחר מכן לחץ "עמוד נכס" ← העתק קישור ושתף.',
      },
      {
        q: 'איך מוסיפים תמונות?',
        a: 'כנס לנכס ← "תמונות" ← גרור קבצים מהמחשב שלך או מהטלפון. מומלץ תמונות טובות ומוארות — הן מגדילות משמעותית את מספר הפניות.',
      },
      {
        q: 'אפשר לערוך את עמוד הנכס אחרי שפרסמתי?',
        a: 'כן, תמיד. כנס לנכס ← ערוך כל שדה ← שמור. השינויים מתעדכנים מיד בעמוד שכבר שיתפת, אין צורך לשלוח קישור חדש.',
      },
      {
        q: 'איך מסמנים שהנכס נמכר?',
        a: 'כנס לנכס ← שנה סטטוס מ"פעיל" ל"נמכר". עמוד הנכס יציג הודעת "נמכר" ויחסם לפניות נוספות.',
      },
    ],
  },
  {
    id: 'share',
    icon: '📤',
    title: 'שיתוף הנכס',
    items: [
      {
        q: 'איך משתפים?',
        a: 'כנס לנכס ← "עמוד נכס" ← העתק קישור ← שלח ב-WhatsApp, פייסבוק, מייל, SMS, יד2 — כל מקום שתרצה. הקישור עובד על כל מכשיר.',
      },
      {
        q: 'איך הנכס נראה לקונה?',
        a: 'הקונה רואה עמוד מעוצב עם תמונות, תיאור, פרטים, מפה, וכפתורי יצירת קשר ישירים (WhatsApp, טלפון). אין פרסומות ואין ממשק מבלבל.',
      },
      {
        q: 'האם מקבלים התראה כשמישהו שואל?',
        a: 'כל פנייה מגיעה ישירות לוואטסאפ שלך (אם הגדרת מספר) או למייל — בהתאם לכפתורים שבחרת להפעיל בעמוד הנכס.',
      },
    ],
  },
  {
    id: 'faq',
    icon: '❓',
    title: 'שאלות נפוצות',
    items: [
      {
        q: 'כמה נכסים אפשר לפרסם?',
        a: 'כרגע אין הגבלה — פרסם כמה נכסים שתרצה בחינם.',
      },
      {
        q: 'מה אם רוצה למכור דרך סוכן?',
        a: 'אם הסוכן שלך עובד עם PropBuilder, הוא יוכל לנהל את הנכס שלך מתוך הדשבורד שלו ולשלוח לך עדכונים דרך מערכת קישורי מוכר.',
      },
      {
        q: 'איך מוחקים את החשבון?',
        a: 'שלח לנו מייל ל-support@propbuilder.co.il עם הכותרת "מחיקת חשבון" ממייל ה-Google שלך. נמחק את כל הנתונים בתוך 48 שעות.',
      },
    ],
  },
]

export default function PersonalHelpPage() {
  const [activeSection, setActiveSection] = useState('start')
  const [openItem, setOpenItem] = useState<string | null>(null)

  const section = SECTIONS.find(s => s.id === activeSection) ?? SECTIONS[0]

  function toggleItem(key: string) {
    setOpenItem(prev => prev === key ? null : key)
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">איך אפשר לעזור?</h1>
        <p className="text-sm text-gray-500 mt-1">
          מדריך שימוש ל-PropBuilder — מוכרים פרטיים
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 justify-center flex-wrap">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => { setActiveSection(s.id); setOpenItem(null) }}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeSection === s.id
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            <span>{s.icon}</span>
            <span>{s.title}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <span className="text-lg">{section.icon}</span>
          <h2 className="font-semibold text-gray-900">{section.title}</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {section.items.map((item, i) => {
            const key = `${section.id}-${i}`
            const isOpen = openItem === key
            return (
              <div key={key}>
                <button
                  onClick={() => toggleItem(key)}
                  className="w-full text-right flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors gap-3"
                >
                  <span className="text-sm font-medium text-gray-800">{item.q}</span>
                  <span className={`text-gray-400 shrink-0 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl px-4 py-3">
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Steps guide */}
      <div className="bg-gradient-to-l from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 text-sm">3 צעדים פשוטים למכירה</h3>
        <div className="space-y-3">
          {[
            { step: '1', title: 'צור עמוד נכס', desc: 'מלא פרטים, העלה תמונות, שמור' },
            { step: '2', title: 'שתף את הקישור', desc: 'WhatsApp, יד2, פייסבוק, מייל' },
            { step: '3', title: 'ענה לפניות', desc: 'קונים יצרו איתך קשר ישירות' },
          ].map(item => (
            <div key={item.step} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="text-center text-sm text-gray-500 pb-4">
        לא מצאת את התשובה?{' '}
        <a href="mailto:support@propbuilder.co.il" className="text-blue-600 hover:underline font-medium">
          כתוב לנו
        </a>
        {' '}ונחזור אליך בהקדם.
      </div>
    </div>
  )
}
