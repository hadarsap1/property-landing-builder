import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'Property Landing Builder — דף נחיתה לנכס תוך דקות';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// ponytail: satori ignores direction:rtl for text run ordering — Hebrew renders
// backwards. We reverse each string so satori's LTR renderer outputs correct
// visual order. Upgrade path: switch to a static PNG or wait for satori RTL support.
function rtl(s: string): string {
  return [...s].reverse().join('');
}

export default function Image(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0f0e17 0%, #1a1826 60%, #0e0e14 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient glows */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,168,83,0.18) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: 100,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-end',
            padding: '0 96px',
            width: '100%',
            gap: 24,
            position: 'relative',
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(212,168,83,0.12)',
              border: '1px solid rgba(212,168,83,0.3)',
              borderRadius: 100,
              padding: '8px 24px',
            }}
          >
            <span style={{ color: '#d4a853', fontSize: 18, fontWeight: 700 }}>
              {rtl('חינמי לחלוטין · ללא הרשמה')}
            </span>
          </div>

          {/* Headline */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 72,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.1,
              textAlign: 'right',
            }}
          >
            <span>{rtl('דף נחיתה לנכס')}</span>
            <span style={{ color: '#d4a853' }}>{rtl('תוך 5 דקות')}</span>
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 28,
              color: '#9ca3af',
              textAlign: 'right',
              lineHeight: 1.5,
              maxWidth: 700,
            }}
          >
            {rtl('ייבוא ממודעה · AI לכתיבת הסיפור · 5 תבניות · קישור לשיתוף')}
          </div>

          {/* URL branding */}
          <div
            style={{
              position: 'absolute',
              bottom: 48,
              left: 96,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: '#6b7280',
              fontSize: 20,
            }}
          >
            <span style={{ color: '#6366f1', fontWeight: 700, fontSize: 22 }}>●</span>
            property-landing-builder.vercel.app
          </div>
        </div>

        {/* Mock card visual (right side top) */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 60,
            width: 240,
            height: 300,
            borderRadius: 28,
            background: 'linear-gradient(165deg, #191921 0%, #0e0e14 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
            transform: 'rotate(6deg)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ width: '100%', height: 120, background: 'linear-gradient(150deg, #162a4a 0%, #1e4070 55%, #0d1e38 100%)' }} />
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ background: 'rgba(212,168,83,0.2)', borderRadius: 8, height: 14, width: '80%' }} />
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 6, height: 10, width: '60%' }} />
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, height: 10, width: '70%' }} />
            <div style={{ marginTop: 8, background: 'rgba(212,168,83,0.3)', borderRadius: 10, height: 28, width: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#d4a853', fontSize: 12, fontWeight: 700 }}>{rtl('יצירת קשר →')}</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
