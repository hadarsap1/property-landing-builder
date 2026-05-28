import type { Metadata } from 'next';
import { sql, hasDb } from '@/lib/db';
import ExamplesGallery, { type PublishedProject } from '@/components/examples/ExamplesGallery';

export const metadata: Metadata = {
  title: 'דוגמאות | Property Landing Builder',
  description: 'ראה דפי נחיתה אמיתיים שנבנו עם המערכת — 5 סגנונות לבחירה',
};

export const revalidate = 300; // refresh published projects every 5 min

async function fetchPublished(): Promise<PublishedProject[]> {
  if (!hasDb()) return [];
  try {
    const rows = await sql!`
      SELECT
        p.code,
        p.title,
        p.city,
        p.rooms::float AS rooms,
        p.price::float AS price,
        p.price_on_request,
        p.template,
        p.data->>'aiTagline' AS tagline,
        COALESCE(
          (p.data->'images'->((COALESCE(p.data->>'heroImageIndex','0'))::int))->>'enhancedBlobUrl',
          (p.data->'images'->((COALESCE(p.data->>'heroImageIndex','0'))::int))->>'blobUrl',
          (p.data->'images'->0)->>'enhancedBlobUrl',
          (p.data->'images'->0)->>'blobUrl'
        ) AS hero_url
      FROM projects p
      WHERE p.is_published = true
        AND (p.expires_at IS NULL OR p.expires_at > now())
      ORDER BY p.created_at DESC
      LIMIT 12
    `;
    return rows as PublishedProject[];
  } catch {
    return [];
  }
}

export default async function ExamplesPage() {
  const published = await fetchPublished();
  return <ExamplesGallery published={published} />;
}
