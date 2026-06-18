'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ContactForm } from '@/components/contact-form'

type Section = {
  id: string
  icon: string
  title: string
  items: { q: string; a: string }[]
}

const SECTIONS: Section[] = [
  {
    id: 'start',
    icon: '🚀',
    title: 'התחלה מהירה',
    items: [
      {
        q: 'איך מוסיפים נכס חדש?',
        a: 'לחץ על "+ נכס חדש" בסרגל הצד. מלא את פרטי הנכס (כתובת, מחיר, תיאור) ולחץ "שמור". לאחר מכן ניתן להוסיף תמונות וליצור עמוד ייחודי לנכס בלחיצה על "עמוד נכס".',
      },
      {
        q: 'איך משתפים עמוד נכס עם לקוחות?',
        a: 'כנס לנכס ← לחץ "עמוד נכס" ← העתק את הקישור מסרגל הכתובת. הקישור ייחודי לכל נכס ומכיל את כל הפרטים, התמונות, ואפשרות לפנות אליך.',
      },
      {
        q: 'איך מזמינים חבר צוות נוסף?',
        a: 'כנס להגדרות ← צוות ← "הזמן סוכן". הזן את כתובת המייל שלו/ה — יישלח מייל עם קישור הרשמה. לאחר ההרשמה הוא יראה את כל הנכסים של הסוכנות.',
      },
    ],
  },
  {
    id: 'listings',
    icon: '🏠',
    title: 'ניהול נכסים',
    items: [
      {
        q: 'איך מוסיפים תמונות לנכס?',
        a: 'כנס לנכס ← לשונית "תמונות" ← גרור קבצים או לחץ "העלה". מומלץ תמונות באיכות גבוהה (לפחות 1200px רוחב). ניתן לסדר סדר תמונות בגרירה.',
      },
      {
        q: 'מה הבדל בין "פעיל", "מושהה" ו"נמכר"?',
        a: 'פעיל — עמוד הנכס נגיש לציבור. מושהה — הנכס לא נגיש אך הנתונים שמורים. נמכר — הנכס הועבר לארכיון, לא מופיע בדשבורד הפעיל.',
      },
      {
        q: 'מה זה "תיאור AI"?',
        a: 'לאחר מילוי פרטי הנכס, PropBuilder מייצר עבורך כותרת, תגית ותיאור שיווקי בסגנון מקצועי. אפשר לערוך את הטקסט שנוצר לפי הצורך.',
      },
      {
        q: 'מה זה "AI Chat" בעמוד הנכס?',
        a: 'כל עמוד נכס ציבורי כולל צ\'אט AI צף בפינה. מבקרים יכולים לשאול שאלות על הנכס — כמה קומות בבניין, האם יש חנייה, מחסן, מעלית, ממ"ד, ועוד. ה-AI עונה על בסיס הנתונים שמילאת בעורך הנכס.',
      },
      {
        q: 'איך אני מוסיף ארנונה / ועד בית / תחבורה ל-AI Chat?',
        a: 'בשלב "הסיפור של הנכס" בעורך, גלול לתחתית — תמצא תיבת "מידע נוסף ל-AI Chat". כתוב שם כל עובדה רלוונטית (ארנונה, ועד בית, מרחק מתחנה, בתי ספר, חיות מחמד וכו\'), ה-AI ישתמש במידע הזה כדי לענות במדויק לקונים.',
      },
      {
        q: 'איך נותנים גישה למוכר לעדכן פרטים?',
        a: 'כנס לנכס ← "קישור מוכר" ← שלח את הקישור למוכר. המוכר יוכל לעדכן מחיר, תיאור ותמונות — כל שינוי שלו מגיע אליך לאישור לפני שמתפרסם.',
      },
      {
        q: 'איך יוצרים פוסט לפייסבוק / אינסטגרם?',
        a: 'בכרטיס הנכס בדשבורד לחץ "✨ פוסט". בחר פלטפורמה (Facebook / Instagram) וטון (חברי / מקצועי / דחוף), לחץ "צור פוסט עם AI", ערוך אם צריך ולחץ "העתק הכל" — כולל hashtags והקישור. הדבק ברשת החברתית שבחרת.',
      },
    ],
  },
  {
    id: 'leads',
    icon: '📬',
    title: 'לידים וקונים',
    items: [
      {
        q: 'מאיפה מגיעים הלידים?',
        a: 'לידים נוצרים אוטומטית כשמישהו ממלא טופס פנייה בעמוד הנכס, לוחץ "תיאום" או שולח וואטסאפ. הם מופיעים מיד בדשבורד ← לידים.',
      },
      {
        q: 'מה ההבדל בין "ליד" לבין "קונה"?',
        a: 'ליד הוא מישהו שהגיב על נכס ספציפי. קונה (כרטיס סגול) הוא מישהו שהתקשר ישירות לשאול על נכסים בכלל — לא נכס אחד. הוסף קונה ידנית ע"י "+ קונה חדש".',
      },
      {
        q: 'איך עוקבים אחרי ליד?',
        a: 'לחץ על הליד ← שנה סטטוס (חדש ← נוצר קשר ← ביקר ← רציני ← הצעה ← סגור). הוסף הערות ותזכורות מעקב. הסטטוסים עוזרים לסדר את הפייפליין.',
      },
      {
        q: 'איך שולחים לקונה קישורי נכסים?',
        a: 'כנס לקארד הקונה ← בפרטי הקונה תמצא את הפרטים שלו. העתק קישורים לנכסים רלוונטיים ושלח ישירות ל-WhatsApp או מייל שמצוין בפרטיו.',
      },
    ],
  },
  {
    id: 'calendar',
    icon: '📅',
    title: 'יומן ביקורים',
    items: [
      {
        q: 'איך מוסיפים ביקור?',
        a: 'כנס ליומן ← לחץ "+ ביקור חדש". בחר נכס, תאריך ושעה, סוג ביקור (קונה / מוכר), ואם יש ליד קיים — ניתן לקשר ביניהם. הביקור יופיע ביומן ובכרטיס הליד.',
      },
      {
        q: 'מה ההבדל בין "ביקור קונה" ל"ביקור מוכר"?',
        a: 'ביקור קונה — פגישה עם לקוח פוטנציאלי בנכס. ביקור מוכר — פגישה עם בעל הנכס (לקבלת מפתח, חתימות, עדכון). שניהם נשמרים ביומן.',
      },
      {
        q: 'איך רואים ביקורים לפי נכס ספציפי?',
        a: 'כנס לנכס ← לשונית "ביקורים". שם יופיעו כל הביקורים הקשורים לנכס הזה, ממויינים לפי תאריך.',
      },
    ],
  },
  {
    id: 'analytics',
    icon: '📊',
    title: 'אנליטיקס',
    items: [
      {
        q: 'מה מדידים האנליטיקס?',
        a: 'מספר צפיות בעמוד הנכס, מבקרים ייחודיים, לחיצות על כפתורי WhatsApp/טלפון/תיאום ביקור, לידים חדשים, ורישומים לבתים פתוחים. הנתונים מעודכנים בזמן אמת.',
      },
      {
        q: 'מה זה "משפך ההמרה" (Funnel)?',
        a: 'ממוקם בראש עמוד האנליטיקס, המשפך מציג את המסע המלא: צפיות → מבקרים ייחודיים → לחיצות יצירת קשר → לידים. בכל שלב מוצגת אחוזת ההמרה לשלב הבא, כך ניתן לזהות בדיוק איפה "נאבדים" לקוחות פוטנציאליים.',
      },
      {
        q: 'האם ניתן לדעת מאיפה הגיעו המבקרים?',
        a: 'כן — האנליטיקס מציג utm_source אם קיים בקישור. שלח קישורים שונים לפי ערוץ (יד2, פייסבוק, וואטסאפ) עם ?utm_source=yad2 וכך תראה מאיפה מגיעים הלידים.',
      },
      {
        q: 'מה זה "דוח שבועי"?',
        a: 'כל יום שני בבוקר נשלח לכל הסוכנים במייל דוח ביצועים שבועי: צפיות, מבקרים ייחודיים, לחיצות יצירת קשר, ולידים חדשים — עם השוואה לשבוע הקודם (חץ ירוק/אדום). הדוח כולל גם את 5 הנכסים המובילים ובתים פתוחים קרובים.',
      },
    ],
  },
  {
    id: 'openhouse',
    icon: '🏡',
    title: 'בית פתוח',
    items: [
      {
        q: 'איך מגדירים בית פתוח לנכס?',
        a: 'בעורך הנכס, גלול לחלק "בית פתוח" — הזן תאריך ושעת התחלה וסיום. הבאנר יופיע אוטומטית בעמוד הנכס הציבורי עם ספירה לאחור ואפשרות להוסיף ליומן גוגל.',
      },
      {
        q: 'איך מתעניינים נרשמים לבית פתוח?',
        a: 'מבקרים בעמוד הנכס יראו בנר "בית פתוח" עם כפתור "הירשם". הם ממלאים שם וטלפון — הרישום מופיע אצלך תחת לידים בסטטוס "בית פתוח".',
      },
      {
        q: 'האם הנרשמים מקבלים תזכורת?',
        a: 'כן — יום לפני כל בית פתוח, כל מי שנרשם ויש לו מייל מקבל תזכורת אוטומטית עם תאריך, שעה, כתובת, וקישור לנכס. לא נדרשת פעולה מצדך.',
      },
      {
        q: 'איך שולחים תזכורת בוואטסאפ לנרשם?',
        a: 'כנס ללידים ← לחץ על ליד עם מקור "בית פתוח". אם ללקוח יש מספר טלפון תראה כפתור ירוק "שלח תזכורת בוואטסאפ". לחיצה עליו תפתח שיחת וואטסאפ עם הודעת תזכורת מוכנה הכוללת תאריך, שעה ושם הנכס.',
      },
    ],
  },
  {
    id: 'domain',
    icon: '🌐',
    title: 'דומיין מותאם',
    items: [
      {
        q: 'מה זה דומיין מותאם אישית?',
        a: 'במקום שעמודי הנכסים שלך יוצגו תחת listings.propbuilder.co.il, ניתן לחבר דומיין משלך כמו listings.my-agency.co.il. כל עמודי הנכסים, ה-Sitemap וה-robots.txt יוגשו מהדומיין שלך אוטומטית.',
      },
      {
        q: 'איך מחברים דומיין?',
        a: '1. אצל ספק הדומיין — הוסף רשומת CNAME שמצביעה מהדומיין שלך אל cname.vercel-dns.com\n2. בהגדרות הסוכנות (דשבורד ← הגדרות) — הזן את הדומיין המלא (למשל: listings.my-agency.co.il) ולחץ "שמור"\n3. ההפניה פעילה תוך כמה דקות. אם אין תעודת SSL — היא נוצרת אוטומטית.',
      },
      {
        q: 'האם ה-SEO משתפר עם דומיין מותאם?',
        a: 'כן — הכתובת הקנונית (canonical URL) של כל נכס, ה-Sitemap וה-Open Graph משתמשים בדומיין שלך. גוגל תאנדקס את עמודי הנכסים תחת המותג שלך.',
      },
    ],
  },
  {
    id: 'billing',
    icon: '💳',
    title: 'חשבון וחיוב',
    items: [
      {
        q: 'כמה ימי ניסיון יש?',
        a: 'יש 14 ימי ניסיון חינם מיום ההרשמה, ללא כרטיס אשראי. לאחר תום הניסיון נדרש לעבור למנוי בתשלום כדי להמשיך לגשת לדשבורד.',
      },
      {
        q: 'מה כלול במנוי?',
        a: 'גישה מלאה לכל הפיצ\'רים: עמודי נכסים ללא הגבלה, לידים, יומן, אנליטיקס, וניהול צוות. מחיר המנוי מופיע בעמוד החיוב.',
      },
      {
        q: 'איך מבטלים מנוי?',
        a: 'כנס לדשבורד ← חיוב ← "בטל מנוי". הגישה תישאר פעילה עד סוף תקופת החיוב הנוכחית. הנתונים נשמרים 30 יום לאחר הביטול.',
      },
    ],
  },
]

export default function BrokerHelpPage() {
  const [activeSection, setActiveSection] = useState<string>('start')
  const [openItem, setOpenItem] = useState<string | null>(null)

  const section = SECTIONS.find(s => s.id === activeSection) ?? SECTIONS[0]

  function toggleItem(key: string) {
    setOpenItem(prev => prev === key ? null : key)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold" style={{ color: '#111' }}>מרכז עזרה — סוכנים</h1>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>עברית</span>
      </div>
      <div className="text-sm flex items-center gap-1 flex-wrap" style={{ color: '#888' }}>
        <span>מצאת בעיה? לא מצאת תשובה?</span>
        <ContactForm source="broker-help" />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => { setActiveSection(s.id); setOpenItem(null) }}
            className="text-right px-4 py-3 rounded-xl text-sm font-medium transition-colors"
            style={activeSection === s.id
              ? { background: '#fef2f2', border: '2px solid #c0392b', color: '#c0392b' }
              : { background: '#fff', border: '2px solid #111', color: '#111' }}
          >
            <span className="text-base ml-1">{s.icon}</span>
            {s.title}
          </button>
        ))}
      </div>

      {/* Active section */}
      <div className="overflow-hidden" style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px' }}>
        <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #e5e5e5' }}>
          <span className="text-lg">{section.icon}</span>
          <h2 className="font-semibold" style={{ color: '#111' }}>{section.title}</h2>
        </div>
        <div>
          {section.items.map((item, i) => {
            const key = `${section.id}-${i}`
            const isOpen = openItem === key
            return (
              <div key={key} style={{ borderBottom: '1px solid #e5e5e5' }}>
                <button
                  onClick={() => toggleItem(key)}
                  className="w-full text-right flex items-center justify-between px-5 py-4 transition-colors gap-3 hover:bg-gray-50"
                >
                  <span className="text-sm font-medium" style={{ color: '#111' }}>{item.q}</span>
                  <span className={`shrink-0 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: '#aaa' }}>▼</span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-4">
                    <p className="text-sm leading-relaxed rounded-xl px-4 py-3" style={{ color: '#888', background: '#f7f5f2' }}>
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Tutorial video placeholder */}
      <div className="rounded-2xl p-6 flex items-center gap-4" style={{ background: '#f7f5f2', border: '2px solid #111' }}>
        <div className="text-4xl shrink-0">🎬</div>
        <div>
          <h3 className="font-semibold text-sm" style={{ color: '#111' }}>סרטוני הדרכה</h3>
          <p className="text-sm mt-0.5" style={{ color: '#888' }}>
            סרטוני וידאו קצרים להדרכה יתווספו בקרוב. בינתיים צור איתנו קשר לעזרה אישית.
          </p>
          <div className="mt-2">
            <ContactForm source="broker-help-tutorial" label="קבע שיחת הדרכה" />
          </div>
        </div>
      </div>

      {/* Shortcuts */}
      <div className="p-5 space-y-3" style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px' }}>
        <h2 className="font-semibold text-sm" style={{ color: '#111' }}>קיצורי דרך שימושיים</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {[
            { label: 'נכסים', href: '/dashboard' },
            { label: 'לידים וקונים', href: '/dashboard/leads' },
            { label: 'יומן ביקורים', href: '/dashboard/calendar' },
            { label: 'אנליטיקס', href: '/dashboard/analytics' },
            { label: 'הגדרות סוכנות', href: '/dashboard/settings' },
            { label: 'ניהול צוות', href: '/dashboard/team' },
            { label: 'חיוב ומנוי', href: '/dashboard/billing' },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 hover:underline"
              style={{ color: '#c0392b' }}
            >
              <span style={{ color: '#aaa' }}>←</span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
