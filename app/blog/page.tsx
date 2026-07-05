import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'מדריכים — איך למכור ולהשכיר נכס',
  description: 'מדריכים מעשיים לבעלי נכסים: איך למכור דירה בלי מתווך, איך לשווק נכס בוואטסאפ, ואיך ליצור דף נחיתה מקצועי לנכס.',
  keywords: ['איך למכור דירה בלי מתווך', 'שיווק נכס וואטסאפ', 'דף נחיתה לדירה', 'מדריך מכירת נכס'],
  openGraph: {
    title: 'מדריכים — איך למכור ולהשכיר נכס | Property Landing Builder',
    description: 'מדריכים מעשיים לבעלי נכסים: מכירה בלי מתווך, שיווק בוואטסאפ ועוד.',
    type: 'website',
  },
};

export const articles = [
  {
    slug: 'lamkor-dira-bli-metuavech',
    title: 'איך למכור דירה בלי מתווך — מדריך מלא ל-2026',
    description: 'כל מה שצריך לדעת: תמחור, שיווק, הצגות ומשא ומתן — בלי לשלם עמלה.',
    date: '2026-06-01',
    readMin: 8,
  },
  {
    slug: 'shivuk-nachass-whatsapp',
    title: 'איך לשווק נכס בוואטסאפ בצורה מקצועית',
    description: 'במקום לשלוח 20 תמונות — שלחו קישור אחד. המדריך לשיווק חכם דרך וואטסאפ.',
    date: '2026-06-05',
    readMin: 5,
  },
  {
    slug: 'daf-nachita-lenachass',
    title: 'מה זה דף נחיתה לנכס ולמה הוא שווה יותר ממודעה ביד2',
    description: 'ההבדל בין מודעה רגילה לדף נחיתה ייעודי — ולמה דף נחיתה מביא יותר פניות רציניות.',
    date: '2026-06-10',
    readMin: 6,
  },
];

export default function BlogPage() {
  return (
    <main
      className="min-h-screen py-24 px-6 max-w-2xl mx-auto"
      dir="rtl"
      lang="he"
      style={{ fontFamily: 'var(--font-assistant, sans-serif)' }}
    >
      <div className="mb-16 text-center">
        <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: 'var(--pb-text2)' }}>
          מדריכים ומאמרים
        </p>
        <h1 className="font-display font-black mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', color: 'var(--pb-text)' }}>
          איך מוכרים נכס נכון
        </h1>
        <p style={{ color: 'var(--pb-text2)' }}>
          טיפים מעשיים לבעלי נכסים שרוצים לשווק בעצמם
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {articles.map((a) => (
          <Link
            key={a.slug}
            href={`/blog/${a.slug}`}
            className="block rounded-2xl p-8 transition-all hover:scale-[1.01]"
            style={{
              background: 'var(--pb-surface)',
              border: '1px solid var(--pb-border)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}
          >
            <div className="flex items-center gap-3 mb-3 text-sm" style={{ color: 'var(--pb-text2)' }}>
              <span>{a.date}</span>
              <span>·</span>
              <span>{a.readMin} דקות קריאה</span>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--pb-text)' }}>
              {a.title}
            </h2>
            <p style={{ color: 'var(--pb-text2)' }}>{a.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-16 text-center">
        <Link
          href="/"
          className="text-sm hover:underline"
          style={{ color: 'var(--pb-text2)' }}
        >
          ← חזרה לעמוד הבית
        </Link>
      </div>
    </main>
  );
}
