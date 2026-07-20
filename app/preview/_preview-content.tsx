'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { PropertyProject } from '@/types/project';
import PropertyChat from '@/components/property-chat';
import { THEMES, FONT_FAMILY, buildSpecs } from '@/components/listing/theme';
import { useTrack } from '@/components/listing/use-track';
import Gallery from '@/components/listing/Gallery';
import OpenHouseBanner from '@/components/listing/OpenHouseBanner';
import StickyContactBar from '@/components/listing/StickyContactBar';
import LeadCaptureForm from '@/components/listing/LeadCaptureForm';
import ShareBar from '@/components/listing/ShareBar';

export default function PreviewContent({ project, editHref, listingId, agencyId, agencyLogoUrl, agencyName, shareCode, calendlyUrl, sold = false }: {
  project: PropertyProject;
  editHref?: string;
  listingId?: string;
  agencyId?: string;
  agencyLogoUrl?: string | null;
  agencyName?: string | null;
  shareCode?: string;
  calendlyUrl?: string | null;
  /** When true the listing is sold: contact & sharing are disabled and a
   *  prominent "sold" treatment covers the page. */
  sold?: boolean;
}) {
  const theme = THEMES[project.template] ?? THEMES['modern-blue'];
  const fontFamily = FONT_FAMILY[project.fontStyle] ?? FONT_FAMILY['sans-serif'];
  const accent = project.accentColor || '#2563eb';
  const heroImage = project.images[project.heroImageIndex];
  const specs = buildSpecs(project);

  const track = useTrack(listingId, agencyId);
  useEffect(() => { track('page_view') }, [track]);

  const isVisible = (id: string) => project.sectionVisibility[id] !== false;

  const title = project.aiTitle || project.title || 'נכס למכירה';
  const tagline = project.aiTagline || '';
  const story = project.aiStory || '';
  const address = [project.street, project.neighborhood, project.city].filter(Boolean).join(', ');
  const price = project.priceOnRequest
    ? ''
    : project.price
    ? `₪${project.price.toLocaleString('he-IL')}`
    : '';

  const whatsappNum = (project.whatsapp || project.phone).replace(/\D/g, '');
  const whatsappUrl = whatsappNum
    ? `https://wa.me/972${whatsappNum.replace(/^0/, '')}?text=${encodeURIComponent(`שלום, ראיתי את הנכס "${title}" ואשמח לשמוע פרטים`)}`
    : '';

  return (
    <div dir="rtl" lang="he" style={{ backgroundColor: theme.pageBg, color: theme.pageText, fontFamily }}>

      {/* ── Sold banner ──────────────────────────────────────────────
          Sticky so it stays visible while scrolling. On agency pages the
          branded navbar is already sticky at top-0, so keep this one in
          normal flow there to avoid two elements pinned to the same spot. */}
      {sold && (
        <div
          className={`${agencyLogoUrl ? 'relative' : 'sticky top-0'} z-[60] flex items-center justify-center gap-3 bg-red-700 text-white text-center px-5 py-3 shadow-lg`}
          role="status"
        >
          <span className="text-lg md:text-xl font-extrabold tracking-wide">
            🔴 הנכס נמכר
          </span>
          <span className="text-xs md:text-sm font-semibold uppercase tracking-[0.2em] opacity-80">
            Sold
          </span>
        </div>
      )}

      {/* ── Agency branded navbar ────────────────────────────────── */}
      {agencyLogoUrl && (
        <div
          className="sticky top-0 z-40 flex items-center gap-3 px-5 py-3 shadow-sm"
          style={{ backgroundColor: theme.cardBg, borderBottom: `1px solid ${theme.cardBorder}` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={agencyLogoUrl}
            alt={agencyName ?? 'לוגו סוכנות'}
            className="h-8 w-auto object-contain max-w-[140px]"
          />
          {agencyName && (
            <span className="text-sm font-semibold truncate" style={{ color: theme.pageText }}>
              {agencyName}
            </span>
          )}
        </div>
      )}

      {/* ── Edit bar (dev / local only) ─────────────────────────── */}
      {editHref && (
        <div className="fixed top-0 right-0 left-0 z-50 bg-blue-600 text-white text-sm text-center py-2 flex items-center justify-center gap-3">
          <span>👁️ תצוגה מקדימה | לא מדף שיתוף</span>
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
              {/* Hero is the LCP element — use the image optimizer for remote URLs.
                  Builder previews use base64 data URLs which next/image can't serve. */}
              {heroImage.dataUrl.startsWith('http') ? (
                <Image
                  src={heroImage.dataUrl}
                  alt={title}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroImage.dataUrl}
                  alt={title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-black/55" />
            </>
          )}
          {/* Big diagonal "Sold" stamp over the hero */}
          {sold && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden">
              <div
                className="flex flex-col items-center justify-center rounded-3xl border-[6px] border-white/90 bg-red-700/85 px-10 py-6 shadow-2xl"
                style={{ transform: 'rotate(-12deg)' }}
              >
                <span className="text-6xl md:text-8xl font-black leading-none text-white drop-shadow">
                  נמכר
                </span>
                <span className="mt-2 text-lg md:text-2xl font-bold uppercase tracking-[0.35em] text-white/90">
                  Sold
                </span>
              </div>
            </div>
          )}
          <div className="relative z-10 text-center px-6 py-16 md:py-24 max-w-4xl mx-auto w-full">
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
            {sold ? (
              <div
                className="inline-block font-bold px-10 py-4 rounded-xl text-lg bg-white/15 text-white border border-white/25"
                style={{ backdropFilter: 'blur(8px)' }}
              >
                הנכס נמכר · תודה על ההתעניינות
              </div>
            ) : (
              <div>
                <a
                  href="#contact"
                  className="inline-block font-semibold px-10 py-4 rounded-xl text-lg text-white transition-opacity hover:opacity-90 shadow-lg"
                  style={{ backgroundColor: accent }}
                >
                  צור קשר עכשיו ↓
                </a>
              </div>
            )}
          </div>
          {/* scroll indicator */}
          {!sold && (
            <div
              className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-50"
              style={{ color: heroImage ? '#fff' : theme.heroText }}
            >
              <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
        </section>
      )}

      {/* ── Open house banner (when scheduled and not long past, hidden when sold) ── */}
      {project.openHouseDate && !sold && (
        <OpenHouseBanner
          dateIso={project.openHouseDate}
          endIso={project.openHouseEnd}
          title={title}
          address={address}
          accent={accent}
          listingId={listingId}
          agencyId={agencyId}
          track={track}
        />
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
                  <Gallery images={project.images} galleryType={project.galleryType} />
                )}
                {project.videoUrl && (
                  <div className="mt-6">
                    <video
                      src={project.videoUrl}
                      controls
                      className="w-full rounded-xl"
                      style={{ maxHeight: '500px' }}
                    />
                  </div>
                )}
                {project.floorPlan && (
                  <div className="mt-10">
                    <h3 className="text-xl font-bold mb-4" style={{ color: theme.pageText }}>תוכנית דירה</h3>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={project.floorPlan.dataUrl}
                      alt="תוכנית דירה"
                      className="w-full rounded-xl object-contain outline outline-1 outline-black/10 dark:outline-white/10"
                      style={{ maxHeight: '600px', background: theme.cardBg }}
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
                {sold ? (
                  <>
                    <div className="text-5xl mb-4">🔴</div>
                    <h2 className="text-3xl font-bold mb-2" style={{ color: theme.heroText }}>
                      הנכס נמכר
                    </h2>
                    <p className="text-lg opacity-75" style={{ color: theme.heroText }}>
                      תודה על ההתעניינות — הנכס כבר אינו זמין
                    </p>
                  </>
                ) : (
                <>
                <h2 className="text-3xl font-bold mb-2" style={{ color: theme.heroText }}>
                  מתעניינים בנכס?
                </h2>
                <p className="text-lg mb-8 opacity-75" style={{ color: theme.heroText }}>
                  צרו קשר ונחזור אליכם בהקדם
                </p>
                {project.sellerName && (
                  <p className="text-xl font-semibold mb-6" style={{ color: theme.heroText }}>
                    {project.sellerName}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                  {project.phone && (
                    <a
                      href={`tel:${project.phone.replace(/\s/g, '')}`}
                      onClick={() => track('phone_click')}
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
                      onClick={() => track('whatsapp_click')}
                      className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors shadow-md"
                    >
                      💬 WhatsApp
                    </a>
                  )}
                  {calendlyUrl && (
                    <a
                      href={calendlyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => track('booking_click')}
                      className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors shadow-md"
                    >
                      📅 קבע פגישה
                    </a>
                  )}
                </div>
                {listingId && agencyId && (
                  <LeadCaptureForm
                    listingId={listingId}
                    agencyId={agencyId}
                    accent={accent}
                    heroText={theme.heroText}
                  />
                )}
                </>
                )}
              </div>
            </section>
          );
        }

        return null;
      })}

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer
        className={`py-6 text-center text-sm border-t ${shareCode ? 'pb-24' : listingId && !editHref ? 'pb-24 sm:pb-6' : ''}`}
        style={{ backgroundColor: theme.pageBg, color: theme.mutedText, borderColor: theme.cardBorder }}
      >
        נבנה בעזרת{' '}
        <Link href="/" className="hover:underline" style={{ color: accent }}>
          Property Landing Builder
        </Link>
        {' · '}
        <Link href="/terms" className="hover:underline" style={{ color: theme.mutedText }}>
          תנאי שימוש
        </Link>
        {' · '}
        <Link href="/privacy" className="hover:underline" style={{ color: theme.mutedText }}>
          פרטיות
        </Link>
      </footer>

      {/* ── AI Chat widget (public listing pages only, hidden when sold) ── */}
      {listingId && !editHref && !sold && (
        <PropertyChat
          listingId={listingId}
          accent={accent}
          hasShareBar={!!shareCode}
          hasMobileBar={!shareCode && !!(project.phone || whatsappUrl)}
        />
      )}

      {/* ── Sticky mobile call/WhatsApp bar (public pages, not share pages, hidden when sold) ── */}
      {listingId && !editHref && !shareCode && !sold && (
        <StickyContactBar
          phone={project.phone}
          whatsappUrl={whatsappUrl}
          accent={accent}
          track={track}
        />
      )}

      {/* ── Floating share bar (public /preview/[code] only, hidden when sold) ─── */}
      {shareCode && !sold && (
        <ShareBar
          shareCode={shareCode}
          title={title}
          openHouseDate={project.openHouseDate}
          theme={theme}
        />
      )}
    </div>
  );
}
