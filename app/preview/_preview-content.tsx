'use client';

import { useState, useEffect } from 'react';
import type { PropertyProject, StoredImage } from '@/types/project';

// ── Theme system ──────────────────────────────────────────────────────────────

type TemplateId = PropertyProject['template'];

interface TemplateTheme {
  heroBg: string;
  heroText: string;
  pageBg: string;
  pageText: string;
  cardBg: string;
  cardBorder: string;
  mutedText: string;
}

const THEMES: Record<TemplateId, TemplateTheme> = {
  'modern-blue': {
    heroBg: 'linear-gradient(135deg,#1e3a5f 0%,#2d5a8e 100%)',
    heroText: '#ffffff',
    pageBg: '#f0f4f8',
    pageText: '#1e293b',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    mutedText: '#64748b',
  },
  'dark-luxury': {
    heroBg: 'linear-gradient(135deg,#0a0e1a 0%,#1a1f35 100%)',
    heroText: '#c9a96e',
    pageBg: '#0d1220',
    pageText: '#e8dcc8',
    cardBg: '#161c2e',
    cardBorder: '#2a3048',
    mutedText: '#8a9cc0',
  },
  'warm-homey': {
    heroBg: 'linear-gradient(135deg,#8b5e3c 0%,#6b4530 100%)',
    heroText: '#f5efe6',
    pageBg: '#f5efe6',
    pageText: '#3d2b1f',
    cardBg: '#ffffff',
    cardBorder: '#e8d5c4',
    mutedText: '#8b6f5e',
  },
  'nature-space': {
    heroBg: 'linear-gradient(135deg,#2d5a27 0%,#1a3518 100%)',
    heroText: '#f0f5f0',
    pageBg: '#f0f5f0',
    pageText: '#1a3518',
    cardBg: '#ffffff',
    cardBorder: '#c8e6c4',
    mutedText: '#5a7a56',
  },
  'urban-bold': {
    heroBg: 'linear-gradient(135deg,#2c1810 0%,#4a2c20 100%)',
    heroText: '#ffffff',
    pageBg: '#faf5f0',
    pageText: '#2c1810',
    cardBg: '#ffffff',
    cardBorder: '#e8d8c8',
    mutedText: '#7a5a4a',
  },
};

const FONT_FAMILY: Record<PropertyProject['fontStyle'], string> = {
  'serif': 'Georgia,"Times New Roman",serif',
  'sans-serif': '"Segoe UI",Arial,sans-serif',
  'display': '"Trebuchet MS","Gill Sans",sans-serif',
};

const AIR_LABEL: Record<string, string> = { N: 'צפון', S: 'דרום', E: 'מזרח', W: 'מערב' };
const PARKING_LABEL: Record<string, string> = { covered: 'מקורה', outdoor: 'חיצונית' };

// ── Gallery ───────────────────────────────────────────────────────────────────

function Gallery({ images, galleryType, accent }: {
  images: StoredImage[];
  galleryType: PropertyProject['galleryType'];
  accent: string;
}) {
  const [current, setCurrent] = useState(0);
  const isCarousel = galleryType !== 'grid';
  const isAuto = galleryType.startsWith('auto-');
  const intervalMs = isAuto
    ? parseInt(galleryType.replace('auto-', '').replace('s', '')) * 1000
    : 0;

  useEffect(() => {
    if (!isAuto || images.length <= 1) return;
    const timer = setInterval(() => setCurrent((c) => (c + 1) % images.length), intervalMs);
    return () => clearInterval(timer);
  }, [isAuto, intervalMs, images.length]);

  if (!isCarousel) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((img) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={img.id}
            src={img.dataUrl}
            alt={img.name}
            className="w-full aspect-video object-cover rounded-xl"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: '16/9' }}>
      {images.map((img, idx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={img.id}
          src={img.dataUrl}
          alt={img.name}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            idx === current ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl transition-colors"
            aria-label="הקודם"
          >
            ›
          </button>
          <button
            type="button"
            onClick={() => setCurrent((c) => (c + 1) % images.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl transition-colors"
            aria-label="הבא"
          >
            ‹
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrent(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === current ? 'bg-white' : 'bg-white/40'
                }`}
                aria-label={`תמונה ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
      {/* Counter badge */}
      <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
        {current + 1} / {images.length}
      </div>
    </div>
  );
}

// ── Spec helpers ──────────────────────────────────────────────────────────────

interface SpecItem { icon: string; label: string; value: string }

function buildSpecs(p: PropertyProject): SpecItem[] {
  const s: SpecItem[] = [];
  if (p.rooms) s.push({ icon: '🏠', label: 'חדרים', value: `${p.rooms}` });
  if (p.builtArea) s.push({ icon: '📐', label: 'שטח', value: `${p.builtArea} מ״ר` });
  if (p.gardenArea) s.push({ icon: '🌿', label: 'גינה/מרפסת', value: `${p.gardenArea} מ״ר` });
  if (p.floor != null) {
    s.push({ icon: '🏢', label: 'קומה', value: p.totalFloors ? `${p.floor} מתוך ${p.totalFloors}` : `${p.floor}` });
  }
  if (p.bathrooms) s.push({ icon: '🛁', label: 'שירותים', value: `${p.bathrooms}` });
  if (p.parkingSpots) {
    const t = p.parkingType ? PARKING_LABEL[p.parkingType] ?? '' : '';
    s.push({ icon: '🚗', label: 'חניה', value: `${p.parkingSpots}${t ? ` ${t}` : ''}` });
  }
  if (p.hasStorage) s.push({ icon: '📦', label: 'מחסן', value: '✓' });
  if (p.hasSaferoom) s.push({ icon: '🛡️', label: 'ממ״ד', value: '✓' });
  if (p.hasElevator) s.push({ icon: '🛗', label: 'מעלית', value: '✓' });
  if (p.buildYear) s.push({ icon: '📅', label: 'שנת בנייה', value: `${p.buildYear}` });
  if (p.renovationYear) s.push({ icon: '🔨', label: 'שיפוץ', value: `${p.renovationYear}` });
  if (p.airDirections?.length) {
    s.push({ icon: '🧭', label: 'כיוונים', value: p.airDirections.map((d) => AIR_LABEL[d] ?? d).join(', ') });
  }
  return s;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PreviewContent({ project, editHref }: {
  project: PropertyProject;
  editHref?: string;
}) {
  const theme = THEMES[project.template] ?? THEMES['modern-blue'];
  const fontFamily = FONT_FAMILY[project.fontStyle] ?? FONT_FAMILY['sans-serif'];
  const accent = project.accentColor || '#2563eb';
  const heroImage = project.images[project.heroImageIndex];
  const specs = buildSpecs(project);

  const isVisible = (id: string) => project.sectionVisibility[id] !== false;

  const title = project.aiTitle || project.title || 'נכס למכירה';
  const tagline = project.aiTagline || '';
  const story = project.aiStory || '';
  const address = [project.street, project.neighborhood, project.city].filter(Boolean).join(', ');
  const price = project.priceOnRequest
    ? 'מחיר לפי פניה'
    : project.price
    ? `₪${project.price.toLocaleString('he-IL')}`
    : '';

  const whatsappNum = (project.whatsapp || project.phone).replace(/\D/g, '');
  const whatsappUrl = whatsappNum
    ? `https://wa.me/972${whatsappNum.replace(/^0/, '')}?text=${encodeURIComponent(`שלום, ראיתי את הנכס "${title}" ואשמח לשמוע פרטים`)}`
    : '';

  return (
    <div dir="rtl" lang="he" style={{ backgroundColor: theme.pageBg, color: theme.pageText, fontFamily }}>

      {/* ── Edit bar (dev / local only) ─────────────────────────── */}
      {editHref && (
        <div className="fixed top-0 right-0 left-0 z-50 bg-blue-600 text-white text-sm text-center py-2 flex items-center justify-center gap-3">
          <span>👁️ תצוגה מקדימה — לא מדף שיתוף</span>
          <a
            href={editHref}
            className="bg-white text-blue-600 px-3 py-1 rounded-full font-semibold text-xs hover:bg-blue-50 transition-colors"
          >
            ← חזרה לעריכה
          </a>
        </div>
      )}

      {/* ── HERO ──────────────────────────────────────────────────── */}
      {isVisible('hero') && (
        <section
          className={`relative flex flex-col items-center justify-center ${editHref ? 'min-h-screen pt-10' : 'min-h-screen'}`}
          style={{ background: heroImage ? undefined : theme.heroBg }}
        >
          {heroImage && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImage.dataUrl}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/55" />
            </>
          )}
          <div className="relative z-10 text-center px-6 py-24 max-w-4xl mx-auto w-full">
            {address && (
              <p
                className="text-sm font-medium tracking-widest uppercase mb-4 opacity-75"
                style={{ color: heroImage ? '#fff' : theme.heroText }}
              >
                {address}
              </p>
            )}
            <h1
              className="text-5xl md:text-7xl font-bold mb-4 leading-tight"
              style={{ color: heroImage ? '#fff' : theme.heroText }}
            >
              {title}
            </h1>
            {tagline && (
              <p
                className="text-xl md:text-2xl mb-6 opacity-90"
                style={{ color: heroImage ? '#f0f0f0' : theme.heroText }}
              >
                {tagline}
              </p>
            )}
            {price && (
              <div
                className="inline-block text-3xl md:text-4xl font-bold px-8 py-3 rounded-2xl mb-10"
                style={{
                  color: accent,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                {price}
              </div>
            )}
            <div>
              <a
                href="#contact"
                className="inline-block font-semibold px-10 py-4 rounded-xl text-lg text-white transition-opacity hover:opacity-90 shadow-lg"
                style={{ backgroundColor: accent }}
              >
                צור קשר עכשיו ↓
              </a>
            </div>
          </div>
          {/* scroll indicator */}
          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-50"
            style={{ color: heroImage ? '#fff' : theme.heroText }}
          >
            <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </section>
      )}

      {/* ── ORDERED SECTIONS ──────────────────────────────────────── */}
      {project.sectionOrder.map((id) => {
        if (!isVisible(id) || id === 'hero') return null;

        // ── Story ──
        if (id === 'story' && (story || project.aiHighlights.length > 0)) {
          return (
            <section key="story" className="py-20 px-6" style={{ backgroundColor: theme.pageBg }}>
              <div className="max-w-3xl mx-auto">
                <h2 className="text-4xl font-bold mb-2 text-center" style={{ color: accent }}>
                  {title}
                </h2>
                {tagline && (
                  <p className="text-lg text-center mb-8 italic" style={{ color: theme.mutedText }}>
                    {tagline}
                  </p>
                )}
                {story && (
                  <p className="text-lg leading-relaxed whitespace-pre-line mb-8" style={{ color: theme.pageText }}>
                    {story}
                  </p>
                )}
                {project.aiHighlights.length > 0 && (
                  <ul className="space-y-3">
                    {project.aiHighlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span
                          className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: accent }}
                        >
                          ✓
                        </span>
                        <span style={{ color: theme.pageText }}>{h}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          );
        }

        // ── Specs ──
        if (id === 'specs' && specs.length > 0) {
          return (
            <section key="specs" className="py-16 px-6" style={{ backgroundColor: theme.cardBg }}>
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: theme.pageText }}>
                  מפרט הנכס
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {specs.map((spec) => (
                    <div
                      key={spec.label}
                      className="rounded-xl p-4 text-center border"
                      style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
                    >
                      <div className="text-2xl mb-1">{spec.icon}</div>
                      <div className="text-xs font-medium mb-1" style={{ color: theme.mutedText }}>
                        {spec.label}
                      </div>
                      <div className="font-bold text-base" style={{ color: theme.pageText }}>
                        {spec.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        // ── Gallery ──
        if (id === 'gallery' && (project.images.length > 0 || project.videoUrl)) {
          return (
            <section key="gallery" className="py-16 px-6" style={{ backgroundColor: theme.pageBg }}>
              <div className="max-w-5xl mx-auto">
                <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: theme.pageText }}>
                  גלריה
                </h2>
                {project.images.length > 0 && (
                  <Gallery
                    images={project.images}
                    galleryType={project.galleryType}
                    accent={accent}
                  />
                )}
                {project.videoUrl && (
                  <div className="mt-6">
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video
                      src={project.videoUrl}
                      controls
                      className="w-full rounded-xl"
                      style={{ maxHeight: '500px' }}
                    />
                  </div>
                )}
              </div>
            </section>
          );
        }

        // ── Map ──
        if (id === 'map' && project.showMap && project.mapQuery) {
          const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(project.mapQuery)}&t=m&z=15&output=embed`;
          return (
            <section key="map" className="py-16 px-6" style={{ backgroundColor: theme.cardBg }}>
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: theme.pageText }}>
                  מיקום
                </h2>
                {address && (
                  <p className="text-center mb-6" style={{ color: theme.mutedText }}>
                    {address}
                  </p>
                )}
                <div
                  className="overflow-hidden rounded-xl border"
                  style={{ borderColor: theme.cardBorder }}
                >
                  <iframe
                    src={mapSrc}
                    width="100%"
                    height="400"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="מיקום הנכס"
                  />
                </div>
                <div className="mt-3 text-center">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(project.mapQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline"
                    style={{ color: accent }}
                  >
                    פתח ב-Google Maps ↗
                  </a>
                </div>
              </div>
            </section>
          );
        }

        // ── Contact ──
        if (id === 'contact') {
          return (
            <section
              key="contact"
              id="contact"
              className="py-24 px-6"
              style={{ background: theme.heroBg }}
            >
              <div className="max-w-xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-2" style={{ color: theme.heroText }}>
                  מתעניין/ת בנכס?
                </h2>
                <p className="text-lg mb-8 opacity-75" style={{ color: theme.heroText }}>
                  צרו קשר ונחזור אליכם בהקדם
                </p>
                {project.sellerName && (
                  <p className="text-xl font-semibold mb-6" style={{ color: theme.heroText }}>
                    {project.sellerName}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {project.phone && (
                    <a
                      href={`tel:${project.phone.replace(/\s/g, '')}`}
                      className="flex items-center justify-center gap-2 font-semibold px-8 py-4 rounded-xl text-lg text-white transition-opacity hover:opacity-90 shadow-md"
                      style={{ backgroundColor: accent }}
                    >
                      📞 {project.phone}
                    </a>
                  )}
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors shadow-md"
                    >
                      💬 WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </section>
          );
        }

        return null;
      })}

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer
        className="py-6 text-center text-sm border-t"
        style={{ backgroundColor: theme.pageBg, color: theme.mutedText, borderColor: theme.cardBorder }}
      >
        נבנה בעזרת{' '}
        <a href="/" className="hover:underline" style={{ color: accent }}>
          Property Landing Builder
        </a>
      </footer>
    </div>
  );
}
