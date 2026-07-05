import type { MetadataRoute } from 'next';
import { sql, hasDb } from '@/lib/db';
import { articles } from './blog/page';

const BASE = 'https://property-landing-builder.vercel.app';

async function publishedCodes(): Promise<string[]> {
  if (!hasDb()) return [];
  try {
    const rows = await sql!`
      SELECT code FROM projects
      WHERE is_published = true
        AND status = 'available'
        AND (expires_at IS NULL OR expires_at > now())
      ORDER BY created_at DESC
      LIMIT 500
    `;
    return (rows as { code: string }[]).map((r) => r.code);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const codes = await publishedCodes();

  const blogRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    ...articles.map((a) => ({
      url: `${BASE}/blog/${a.slug}`,
      lastModified: new Date(a.date),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/builder`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/examples`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
  ];

  const propertyRoutes: MetadataRoute.Sitemap = codes.map((code) => ({
    url: `${BASE}/preview/${code}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...blogRoutes, ...propertyRoutes];
}
