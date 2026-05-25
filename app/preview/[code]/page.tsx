import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { PropertyProject } from '@/types/project';
import PreviewContent from '../_preview-content';

export const dynamic = 'force-dynamic';

// ── Data loading ──────────────────────────────────────────────────────────────

async function loadProject(code: string): Promise<PropertyProject | null> {
  if (!/^\d{6}$/.test(code)) return null;
  if (!process.env.KV_URL) return null;
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
  const city = project.city ? ` — ${project.city}` : '';
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
  return <PreviewContent project={project} />;
}
