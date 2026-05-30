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
  const desc = project.aiTagline || `${project.rooms ?? ''} חדרים${city}`;
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, type: 'website' },
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
  return (
    <>
      <ViewTracker projectCode={code} />
      <PreviewContent project={project} shareCode={code} />
    </>
  );
}
