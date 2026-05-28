'use client';

import { useState } from 'react';
import { STATIC_EXAMPLES, type StaticExample } from '@/lib/examples';

export interface PublishedProject {
  code: string;
  title: string | null;
  city: string | null;
  rooms: number | null;
  price: number | null;
  price_on_request: boolean;
  hero_url: string | null;
  template: string | null;
  tagline: string | null;
}

interface Props {
  published: PublishedProject[];
}

function fmtPrice(price: number | null, onRequest: boolean): string {
  if (onRequest) return 'לפי פנייה';
  if (!price) return '';
  return `₪${(price / 1_000_000).toFixed(1)}M`;
}

function StaticCard({ ex }: { ex: StaticExample }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative rounded-2xl overflow-hidden cursor-pointer group"
      style={{ background: ex.heroBg, minHeight: 280 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Decorative inner glow */}
      <div className="absolute inset-0 opacity-20"
        style={{ background: `radial-gradient(ellipse at 30% 40%, ${ex.accent}55 0%, transparent 70%)` }}
      />

      {/* Badge */}
      <div className="absolute top-4 right-4">
        <span
          className="text-xs font-bold px-3 py-1 rounded-full"
          style={{ backgroundColor: ex.accent + '33', color: ex.accent, border: `1px solid ${ex.accent}55` }}
        >
          {ex.badge}
        </span>
      </div>

      {/* Fake image placeholder — grid of subtle lines */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <div className="grid grid-cols-3 gap-2 w-full h-full p-8">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-lg" style={{ backgroundColor: ex.heroText }} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 flex flex-col justify-between h-full" style={{ minHeight: 280 }}>
        <div className="mt-8">
          <p className="text-xs font-semibold opacity-60 mb-1" style={{ color: ex.heroText }}>
            {ex.city} · {ex.rooms} חדרים · {ex.builtArea} מ״ר
          </p>
          <h3 className="text-lg font-bold leading-snug mb-2" style={{ color: ex.heroText }}>
            {ex.title}
          </h3>
          <p className="text-sm opacity-70 leading-relaxed" style={{ color: ex.heroText }}>
            {ex.tagline}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-xl font-bold" style={{ color: ex.accent }}>
            ₪{(ex.price / 1_000_000).toFixed(1)}M
          </span>
          <a
            href={`/builder?template=${ex.template}`}
            className="text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            style={{
              backgroundColor: hovered ? ex.accent : ex.accent + '22',
              color: hovered ? '#fff' : ex.accent,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            נסה סגנון זה →
          </a>
        </div>
      </div>
    </div>
  );
}

function PublishedCard({ project }: { project: PublishedProject }) {
  return (
    <a
      href={`/preview/${project.code}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative rounded-2xl overflow-hidden block shadow-sm hover:shadow-lg transition-shadow"
      style={{ minHeight: 280 }}
    >
      {/* Hero image */}
      {project.hero_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.hero_url}
          alt={project.title ?? ''}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Live badge */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        בשוק
      </div>

      {/* Content */}
      <div className="absolute bottom-0 inset-x-0 p-5">
        <p className="text-white/60 text-xs mb-1">
          {[project.city, project.rooms ? `${project.rooms} חד׳` : null]
            .filter(Boolean).join(' · ')}
        </p>
        <h3 className="text-white font-bold text-base leading-snug mb-1 truncate">
          {project.title ?? 'נכס למכירה'}
        </h3>
        {project.tagline && (
          <p className="text-white/70 text-xs line-clamp-2 mb-2">{project.tagline}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-white font-bold text-lg">
            {fmtPrice(project.price, project.price_on_request)}
          </span>
          <span className="text-xs text-white/80 bg-white/10 px-3 py-1 rounded-full group-hover:bg-white/20 transition-colors">
            צפה בדף ←
          </span>
        </div>
      </div>
    </a>
  );
}

export default function ExamplesGallery({ published }: Props) {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white px-6 py-16 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3 leading-tight">
          ראה מה אפשר לבנות
        </h1>
        <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
          דפי נחיתה מקצועיים לנכסים — בפחות מ-5 דקות, ללא עיצוב, ללא קוד
        </p>
        <a
          href="/builder"
          className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-3.5 rounded-2xl hover:bg-blue-50 transition-colors shadow-lg text-base"
        >
          🚀 בנה את הדף שלך עכשיו — חינם
        </a>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-14">

        {/* Published projects */}
        {published.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-bold text-gray-900">נכסים אמיתיים מהמערכת</h2>
              <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">
                {published.length} נכסים פעילים
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {published.map((p) => (
                <PublishedCard key={p.code} project={p} />
              ))}
            </div>
          </section>
        )}

        {/* Template showcase */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">5 סגנונות לבחירה</h2>
            <p className="text-sm text-gray-500">כל אחד עם פלטת צבעים, פונטים ותחושה שונה</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {STATIC_EXAMPLES.map((ex) => (
              <StaticCard key={ex.id} ex={ex} />
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="text-center pb-6">
          <div className="bg-white rounded-2xl border border-gray-200 px-8 py-10 max-w-lg mx-auto shadow-sm">
            <div className="text-4xl mb-3">🏠</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">מוכן להתחיל?</h3>
            <p className="text-sm text-gray-500 mb-6">
              מכניסים פרטים, AI כותב את הטקסט, אתה בוחר סגנון — ומקבל קישור לשיתוף
            </p>
            <a
              href="/builder"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition-colors"
            >
              התחל עכשיו — חינם
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}
