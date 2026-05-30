import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Allow mobile devices on the local network to access the dev server
  allowedDevOrigins: ['10.100.102.12'],

  async headers() {
    // ── Content-Security-Policy ──────────────────────────────────────────────
    // Allows:
    //  - self for all standard resources
    //  - unsafe-inline styles: required by the inline `style=` props used
    //    throughout the app (templates, theme tokens)
    //  - blob: images: used before project images are uploaded to Blob storage
    //  - data: images: needed for base64 previews during editing
    //  - maps.google.com iframe: Step 5 map preview
    //  - wa.me: WhatsApp share links
    //  - Vercel Analytics, Speed Insights, and Resend pixel
    //  - Google OAuth: used by NextAuth for sign-in
    const csp = [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://vitals.vercel-insights.com`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src 'self' data: blob: https: http:`,
      `media-src 'self' blob:`,
      `font-src 'self' data:`,
      `frame-src 'self' https://maps.google.com https://www.google.com`,
      `connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com https://accounts.google.com`,
      `form-action 'self' https://accounts.google.com`,
      `base-uri 'self'`,
      `object-src 'none'`,
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
