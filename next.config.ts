import type { NextConfig } from "next";

const ContentSecurityPolicy = [
  "default-src 'self'",
  // Next.js requires unsafe-inline/eval for dev HMR; keep for compat
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  // Property images are served from Vercel Blob and agent-uploaded URLs
  "img-src * data: blob:",
  "media-src * blob:",
  "font-src 'self' data:",
  // 'self' for the builder's same-origin live-preview iframe;
  // Google Maps embeds + optional YouTube video sections
  "frame-src 'self' maps.google.com www.google.com www.youtube.com",
  // Same-origin API + Vercel Analytics/Speed Insights endpoints
  "connect-src 'self' vitals.vercel-insights.com *.vercel-analytics.com",
  "frame-ancestors 'self'",
].join('; ')

const securityHeaders = [
  { key: 'X-Content-Type-Options',     value: 'nosniff' },
  { key: 'X-Frame-Options',            value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=(self)' },
  { key: 'Content-Security-Policy',    value: ContentSecurityPolicy },
]

const nextConfig: NextConfig = {
  // Next.js 16 uses Turbopack by default.
  // `root` tells Turbopack this project is self-contained, silencing the
  // "multiple lockfiles" warning caused by ~/package.json existing at home dir.
  turbopack: {
    root: __dirname,
  },

  images: {
    remotePatterns: [
      // Vercel Blob storage (public blobs from @vercel/blob)
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
