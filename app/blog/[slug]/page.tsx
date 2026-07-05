import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { articles } from '../page';

const content: Record<string, React.ReactNode> = {
  'lamkor-dira-bli-metuavech': (
    <>
      <p>מכירת דירה בלי מתווך יכולה לחסוך לכם <strong>עשרות אלפי שקלים</strong> בעמלות. זה אפשרי — אם עושים את זה נכון.</p>

      <h2>שלב 1: תמחור נכון</h2>
      <p>בדקו עסקאות אחרונות ב<strong>רשם המקרקעין</strong> ובאתרי נדל"ן (יד2, מדלן). המחיר הנכון מביא קונים רציניים תוך שבועיים — מחיר גבוה מדי מייצר שיחות מדהמנות.</p>
      <p>כלל אצבע: אם אחרי שלושה שבועות אין הצגות — ירידה של 3%-5% במחיר בדרך כלל פותחת את השוק.</p>

      <h2>שלב 2: הכינו את הנכס</h2>
      <ul>
        <li>סדר ונקיון — הנכס הנקי נמכר מהר יותר ובמחיר גבוה יותר</li>
        <li>תמונות מקצועיות — השקיעו 300–500 ₪ בצלם, זה מחזיר את עצמו עשרת מונים</li>
        <li>תיקונים קטנים — ברז מטפטף, חלון שבור, צבע קולף — טפלו בהם לפני הצגות</li>
      </ul>

      <h2>שלב 3: צרו דף נחיתה לנכס</h2>
      <p>במקום לשלוח תמונות מפוזרות בוואטסאפ — צרו <strong>דף נחיתה ייעודי לנכס</strong>. דף כזה כולל:</p>
      <ul>
        <li>גלריית תמונות מסודרת</li>
        <li>מאפייני הנכס (חדרים, שטח, קומה, חניה)</li>
        <li>סיפור הנכס שכתב AI</li>
        <li>כפתור ליצירת קשר ישיר</li>
      </ul>
      <p>עם <a href="/">Property Landing Builder</a> יוצרים דף כזה תוך 5 דקות — חינם לגמרי.</p>

      <h2>שלב 4: שיווק</h2>
      <ul>
        <li><strong>יד2 ומדלן</strong> — העלו מודעה עם קישור לדף הנחיתה שלכם</li>
        <li><strong>קבוצות וואטסאפ שכונתיות</strong> — שלחו את הקישור לדף עם משפט פתיחה קצר</li>
        <li><strong>פייסבוק</strong> — קבוצות "נדל"ן" לפי עיר</li>
        <li><strong>רשת האנשים שלכם</strong> — לעיתים הקונה הכי טוב הוא חבר של חבר</li>
      </ul>

      <h2>שלב 5: הצגות ומשא ומתן</h2>
      <p>קבעו הצגות בשעות אור יום, כשהדירה נראית הכי טוב. ניהלו פרוטוקול: שם, טלפון, הערות ראשוניות — כך תדעו לאיזה מתעניין לחזור.</p>
      <p>אל תנהלו משא ומתן בסמס — תאמו שיחה או פגישה. קונה שמוריד מחיר בהודעה לא רציני בדרך כלל.</p>

      <h2>שלב 6: חוזה ורישום</h2>
      <p>לאחר גיבוש עסקה — <strong>חובה עורך דין</strong>. שכר הטרחה לעסקת נדל"ן הוא 0.5%–1%, הרבה פחות מעמלת מתווך. לא לחסוך על זה.</p>
    </>
  ),

  'shivuk-nachass-whatsapp': (
    <>
      <p>רוב בעלי נכסים שולחים 20 תמונות לכל מתעניין, מחכים לתגובה, ומסבירים שוב ושוב את אותם הפרטים. יש דרך טובה יותר.</p>

      <h2>הבעיה עם "חבילת תמונות"</h2>
      <ul>
        <li>תמונות מגיעות ללא הקשר — אין מחיר, אין מאפיינים, אין סיפור</li>
        <li>הנמען צריך לשאול עשר שאלות בסיסיות</li>
        <li>נראה לא מקצועי בעיני קונים רציניים</li>
        <li>אי אפשר לשלוח הלאה בקלות</li>
      </ul>

      <h2>הפתרון: קישור אחד לדף נחיתה</h2>
      <p>במקום תמונות — שלחו קישור. כשמישהו פותח אותו, הוא רואה:</p>
      <ul>
        <li>גלריית תמונות מסודרת ונגישה</li>
        <li>כל המאפיינים (חדרים, שטח, קומה, חניה, מצב)</li>
        <li>מחיר ברור</li>
        <li>סיפור הנכס</li>
        <li>כפתור שמתקשר ישירות</li>
      </ul>
      <p>מי שמתקשר אחרי שראה את הדף — קונה רציני. חסכתם שיחה של 10 דקות עם כל פונה.</p>

      <h2>איך כותבים את ההודעה בוואטסאפ</h2>
      <p>אל תעמיסו. הודעה קצרה עובדת טוב יותר:</p>
      <blockquote style={{ borderRight: '3px solid var(--pb-gold)', paddingRight: '1rem', margin: '1rem 0', color: 'var(--pb-text2)', fontStyle: 'italic' }}>
        "שלום! מוכרים דירת 4 חדרים בפלורנטין, קומה 3, חניה, 2.65 מ&#39;. כל הפרטים והתמונות כאן: [קישור]"
      </blockquote>
      <p>הקישור עושה את העבודה — לא צריך להסביר הכל בהודעה.</p>

      <h2>טיפ: שלחו לקבוצות שכונה</h2>
      <p>הקונה הכי טוב לדירה בשכונה מסוימת — לעיתים קרובות — כבר גר בשכונה (רוצה להישאר) או מחפש שם (רשת חברים). קבוצות וואטסאפ שכונתיות הן מכרה זהב.</p>
      <p>גישה מנצחת: "מוכרים בשכונה — ראו את הפרטים" ← קישור. לא יותר מזה.</p>

      <h2>איך יוצרים קישור כזה?</h2>
      <p>עם <a href="/">Property Landing Builder</a> — 5 דקות, חינם, ללא הרשמה. מקבלים קישור ייחודי לשיתוף.</p>
    </>
  ),

  'daf-nachita-lenachass': (
    <>
      <p>מודעה ביד2 מציגה את הנכס שלכם לצד עשרות נכסים אחרים. דף נחיתה ייעודי מציג <em>רק</em> את הנכס שלכם — בתנאים שלכם.</p>

      <h2>מה מקבלים במודעה רגילה</h2>
      <ul>
        <li>5–10 תמונות בגלריה סטנדרטית</li>
        <li>שדות נתונים קשיחים</li>
        <li>תחרות ישירה עם מודעות סמוכות</li>
        <li>קישורים לנכסים דומים בתחתית</li>
        <li>אפס יכולת לספר את סיפור הנכס</li>
      </ul>

      <h2>מה מקבלים בדף נחיתה ייעודי</h2>
      <ul>
        <li><strong>עיצוב שלם</strong> — 5 תבניות, צבעים, פונט</li>
        <li><strong>גלריה ללא הגבלה</strong> — סרגל, רשת, או קרוסלה אוטומטית</li>
        <li><strong>סיפור הנכס</strong> שכתב AI — לא רק שדות יבשים</li>
        <li><strong>הדגשות ייחודיות</strong> — מה שמייחד את הנכס שלכם</li>
        <li><strong>מפה</strong> — המיקום בהקשר השכונתי</li>
        <li><strong>כפתורי שיתוף</strong> — קישור אחד לכל ערוץ</li>
        <li><strong>ניתוח צפיות</strong> — כמה אנשים ראו את הדף</li>
      </ul>

      <h2>שתי גישות משלימות, לא מתחרות</h2>
      <p>אין צורך לבחור בין מודעה ביד2 לבין דף נחיתה — השתמשו בשניהם.</p>
      <p>העלו מודעה ביד2 עם קישור לדף הנחיתה שלכם. מי שלוחץ — מגיע לחוויה מלאה שמרשימה ומסננת מתעניינים לא רציניים.</p>

      <h2>מה ההבדל בפועל?</h2>
      <p>פניות ממודעה רגילה: "כמה חדרים?" / "יש חניה?" / "מה הקומה?" — שאלות בסיסיות שהדף כבר עונה עליהן.</p>
      <p>פניות מדף נחיתה: "ראיתי את הדף, מתי אפשר לראות?" — מתעניינים שכבר יודעים מה הם מקבלים.</p>

      <h2>איך יוצרים דף נחיתה לנכס?</h2>
      <p><a href="/">Property Landing Builder</a> — תוך 5 דקות, ללא קוד, חינם לגמרי. מכניסים פרטים, AI כותב את הסיפור, מקבלים קישור.</p>
    </>
  ),
};

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) return { title: 'מאמר לא נמצא' };
  return {
    title: article.title,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      type: 'article',
      publishedTime: article.date,
    },
    alternates: { canonical: `https://property-landing-builder.vercel.app/blog/${slug}` },
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  const body = content[slug];

  return (
    <main
      dir="rtl"
      lang="he"
      style={{ fontFamily: 'var(--font-assistant, sans-serif)' }}
    >
      <article className="max-w-2xl mx-auto px-6 py-24">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: article.title,
              description: article.description,
              datePublished: article.date,
              inLanguage: 'he',
              author: { '@type': 'Organization', name: 'Property Landing Builder' },
              publisher: {
                '@type': 'Organization',
                name: 'Property Landing Builder',
                url: 'https://property-landing-builder.vercel.app',
              },
            }),
          }}
        />

        <Link href="/blog" className="text-sm hover:underline mb-10 block" style={{ color: 'var(--pb-text2)' }}>
          ← כל המדריכים
        </Link>

        <div className="flex items-center gap-3 text-sm mb-6" style={{ color: 'var(--pb-text2)' }}>
          <span>{article.date}</span>
          <span>·</span>
          <span>{article.readMin} דקות קריאה</span>
        </div>

        <h1
          className="font-display font-black mb-8"
          style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: 'var(--pb-text)', lineHeight: 1.2 }}
        >
          {article.title}
        </h1>

        <div
          className="prose-article"
          style={{ color: 'var(--pb-text)' }}
        >
          {body}
        </div>

        <div
          className="mt-16 p-8 rounded-2xl text-center"
          style={{ background: 'var(--pb-surface)', border: '1px solid var(--pb-border)' }}
        >
          <p className="font-bold text-lg mb-3" style={{ color: 'var(--pb-text)' }}>
            מוכנים ליצור דף נחיתה לנכס שלכם?
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--pb-text2)' }}>
            5 דקות. חינם. ללא הרשמה.
          </p>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, var(--pb-accent), #1d4ed8)' }}
          >
            התחילו עכשיו ←
          </Link>
        </div>
      </article>
    </main>
  );
}
