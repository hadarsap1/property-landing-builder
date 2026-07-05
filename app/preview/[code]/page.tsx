import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { PropertyProject } from '@/types/project';
import { sql, hasDb } from '@/lib/db';
import { isDevStore, devStoreGet } from '@/lib/dev-store';
import PreviewContent from '../_preview-content';
import ViewTracker from '@/components/preview/ViewTracker';

export const dynamic = 'force-dynamic';

// ── Data loading ──────────────────────────────────────────────────────────────
// Prod stores projects in Postgres; KV is the dev / legacy fallback. The status
// column is authoritative, so we overlay it onto the JSONB data when present.

async function loadProject(code: string): Promise<PropertyProject | null> {
  if (!/^\d{6}$/.test(code)) return null;

  if (hasDb()) {
    try {
      const rows = await sql!`
        SELECT data, status, expires_at FROM projects WHERE code = ${code} LIMIT 1
      `;
      if (rows.length > 0) {
        const row = rows[0] as { data: PropertyProject; status: string; expires_at: string | null };
        if (row.expires_at && new Date(row.expires_at) < new Date()) return null;
        return { ...row.data, status: (row.status as PropertyProject['status']) ?? row.data.status ?? 'available' };
      }
    } catch {
      // fall through to KV
    }
  }

  if (process.env.KV_URL) {
    try {
      const { kv } = await import('@vercel/kv');
      const data = await kv.get<unknown>(`project:${code}`);
      if (!data) return null;
      return typeof data === 'string'
        ? (JSON.parse(data) as PropertyProject)
        : (data as PropertyProject);
    } catch {
      return null;
    }
  }

  // Local dev fallback (no DB, no KV)
  if (isDevStore()) return devStoreGet(code);
  return null;
}

// ── Metadata ──────────────────────────────────────────────────────────────────

const BASE = 'https://property-landing-builder.vercel.app';

function priceLabel(p: PropertyProject): string {
  if (p.priceOnRequest) return 'מחיר לפי פנייה';
  if (!p.price) return '';
  return p.listingType === 'rent'
    ? `₪${p.price.toLocaleString('he-IL')} לחודש`
    : `₪${p.price.toLocaleString('he-IL')}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const project = await loadProject(code);
  if (!project) return { title: 'נכס לא נמצא' };

  const title = project.aiTitle || project.title || 'נכס למכירה';
  const city = project.city ? `, ${project.city}` : '';
  const neighborhood = project.neighborhood ? ` — ${project.neighborhood}` : '';
  const price = priceLabel(project);
  const rooms = project.rooms ? `${project.rooms} חדרים` : '';
  const desc =
    project.aiTagline ||
    [rooms, city ? `ב${project.city}` : '', price].filter(Boolean).join(' | ');

  const pageUrl = `${BASE}/preview/${code}`;
  const ogImage = `${BASE}/preview/${code}/opengraph-image`;
  const heroUrl =
    project.images?.[project.heroImageIndex ?? 0]?.blobUrl ??
    project.images?.[0]?.blobUrl;

  const isPublished = project.status === 'available' || project.status === 'sold' || project.status === 'rented';

  return {
    title: `${title}${neighborhood}${city}`,
    description: desc,
    ...(!isPublished ? { robots: { index: false, follow: false } } : {}),
    alternates: { canonical: pageUrl },
    openGraph: {
      title: `${title} — ${price || (project.listingType === 'rent' ? 'להשכרה' : 'למכירה')}`,
      description: desc,
      type: 'website',
      url: pageUrl,
      locale: 'he_IL',
      images: [
        { url: ogImage, width: 1200, height: 630, alt: title },
        ...(heroUrl ? [{ url: heroUrl, width: 1200, height: 800, alt: title }] : []),
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — ${price || (project.listingType === 'rent' ? 'להשכרה' : 'למכירה')}`,
      description: desc,
      images: [ogImage],
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const project = await loadProject(code);
  if (!project) notFound();

  const pageUrl = `${BASE}/preview/${code}`;
  const title = project.aiTitle || project.title || 'נכס למכירה';
  const price = priceLabel(project);
  const heroUrl =
    project.images?.[project.heroImageIndex ?? 0]?.blobUrl ??
    project.images?.[0]?.blobUrl;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: title,
    description: project.aiTagline || project.aiStory?.slice(0, 200) || '',
    url: pageUrl,
    ...(heroUrl ? { image: heroUrl } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: project.street || '',
      addressLocality: project.city || '',
      addressRegion: project.neighborhood || '',
      addressCountry: 'IL',
    },
    ...(project.price && !project.priceOnRequest
      ? {
          offers: {
            '@type': 'Offer',
            price: project.price,
            priceCurrency: 'ILS',
            name: price,
          },
        }
      : {}),
    ...(project.rooms ? { numberOfRooms: project.rooms } : {}),
    ...(project.builtArea ? { floorSize: { '@type': 'QuantitativeValue', value: project.builtArea, unitCode: 'MTK' } } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <ViewTracker projectCode={code} />
      <PreviewContent project={project} shareCode={code} />
    </>
  );
}
