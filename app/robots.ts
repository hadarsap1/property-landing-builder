import type { MetadataRoute } from 'next';

const BASE = 'https://property-landing-builder.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/builder', '/examples', '/preview/'],
        disallow: ['/admin', '/dashboard', '/manage', '/api/', '/preview/local'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
