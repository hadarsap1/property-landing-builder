import { ImageResponse } from 'next/og';
import { sql, hasDb } from '@/lib/db';
import { isDevStore, devStoreGet } from '@/lib/dev-store';
import type { PropertyProject } from '@/types/project';

export const runtime = 'nodejs';
export const alt = 'תמונת נכס';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// ponytail: satori ignores direction:rtl — reverse strings for correct visual order
function rtl(s: string): string {
  return [...s].reverse().join('');
}

async function loadProject(code: string): Promise<PropertyProject | null> {
  if (!/^\d{6}$/.test(code)) return null;
  if (hasDb()) {
    try {
      const rows = await sql!`SELECT data, status FROM projects WHERE code = ${code} LIMIT 1`;
      if (rows.length > 0) {
        const row = rows[0] as { data: PropertyProject; status: string };
        return { ...row.data, status: (row.status as PropertyProject['status']) ?? row.data.status ?? 'available' };
      }
    } catch { /* fall through */ }
  }
  if (process.env.KV_URL) {
    try {
      const { kv } = await import('@vercel/kv');
      const data = await kv.get<unknown>(`project:${code}`);
      if (!data) return null;
      return typeof data === 'string' ? (JSON.parse(data) as PropertyProject) : (data as PropertyProject);
    } catch { return null; }
  }
  if (isDevStore()) return devStoreGet(code);
  return null;
}

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const project = await loadProject(code);

  const title = rtl(project?.aiTitle || project?.title || 'נכס למכירה');
  const city = project?.city ? rtl(`${project.city}${project.neighborhood ? ` — ${project.neighborhood}` : ''}`) : '';
  const rooms = project?.rooms ? rtl(`${project.rooms} חדרים`) : '';
  const area = project?.builtArea ? rtl(`${project.builtArea} מ"ר`) : '';
  const heroUrl = project?.images?.[project.heroImageIndex ?? 0]?.blobUrl ?? project?.images?.[0]?.blobUrl;

  let priceText = '';
  if (project) {
    if (project.priceOnRequest) {
      priceText = rtl('מחיר לפי פנייה');
    } else if (project.price) {
      priceText = project.listingType === 'rent'
        ? rtl(`₪${project.price.toLocaleString('he-IL')} / חודש`)
        : rtl(`₪${project.price.toLocaleString('he-IL')}`);
    }
  }

  const specs = [rooms, area].filter(Boolean).join(' · ');

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
          background: '#1a1a2e',
        }}
      >
        {/* Background image */}
        {heroUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroUrl}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.45,
            }}
          />
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 100%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '60px 72px',
            position: 'relative',
            width: '100%',
            gap: 16,
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                background: '#6366f1',
                color: '#fff',
                fontSize: 20,
                fontWeight: 700,
                padding: '6px 20px',
                borderRadius: 100,
              }}
            >
              {rtl(project?.listingType === 'rent' ? 'להשכרה' : 'למכירה')}
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.2,
              maxWidth: 800,
            }}
          >
            {title}
          </div>

          {/* City + specs */}
          {(city || specs) && (
            <div style={{ display: 'flex', gap: 24, color: '#d1d5db', fontSize: 28, alignItems: 'center' }}>
              {city && <span>{city}</span>}
              {city && specs && <span style={{ color: '#6b7280' }}>·</span>}
              {specs && <span>{specs}</span>}
            </div>
          )}

          {/* Price */}
          {priceText && (
            <div style={{ fontSize: 40, fontWeight: 700, color: '#a5b4fc', marginTop: 4 }}>
              {priceText}
            </div>
          )}

          {/* Branding */}
          <div
            style={{
              position: 'absolute',
              top: 48,
              left: 72,
              color: '#9ca3af',
              fontSize: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ color: '#6366f1', fontWeight: 700 }}>●</span>
            Property Landing Builder
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
