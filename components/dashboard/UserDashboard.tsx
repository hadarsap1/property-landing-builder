'use client';

import { useState } from 'react';
import type { PropertyStatus } from '@/types/project';

export interface UserProject {
  code: string;
  title: string | null;
  city: string | null;
  rooms: number | null;
  price: number | null;
  price_on_request: boolean;
  is_published: boolean;
  status: PropertyStatus;
  created_at: string;
  expires_at: string | null;
  hero_url: string | null;
  view_count: number;
  contact_clicks: number;
  whatsapp_clicks: number;
}

const STATUS_LABEL: Record<PropertyStatus, string> = {
  available: 'פעיל',
  sold: 'נמכר',
  rented: 'הושכר',
};

interface Props {
  projects: UserProject[];
  userName: string | null;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function fmtPrice(p: UserProject): string {
  if (p.price_on_request) return 'לפי פנייה';
  if (!p.price) return '';
  return `₪${(p.price / 1_000_000).toFixed(1)}M`;
}

function ProjectCard({
  project,
  onToggle,
  onDelete,
  onSetStatus,
}: {
  project: UserProject;
  onToggle: (code: string, current: boolean) => void;
  onDelete: (code: string, title: string | null) => void;
  onSetStatus: (code: string, status: PropertyStatus) => void;
}) {
  const isClosed = project.status === 'sold' || project.status === 'rented';
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col" style={{ background: 'var(--pb-surface)', border: '1px solid var(--pb-border)' }}>
      {/* Hero image */}
      <div className="relative h-40" style={{ background: 'var(--pb-surface2)' }}>
        {project.hero_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.hero_url} alt={project.title ?? ''} className={`w-full h-full object-cover ${isClosed ? 'opacity-60' : ''}`} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl" style={{ color: 'var(--pb-border)' }}>🏠</div>
        )}
        {/* Published badge */}
        <div className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
          project.is_published ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          {project.is_published ? '✓ מפורסם' : 'טיוטה'}
        </div>
        {/* Sold / Rented badge */}
        {isClosed && (
          <div className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full bg-red-600 text-white">
            {STATUS_LABEL[project.status]}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div>
          <h3 className="font-bold text-sm leading-tight truncate" style={{ color: 'var(--pb-text)' }}>
            {project.title ?? 'ללא כותרת'}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--pb-text2)' }}>
            {[project.city, project.rooms ? `${project.rooms} חד׳` : null, fmtPrice(project)]
              .filter(Boolean).join(' · ')}
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-xs" style={{ color: 'var(--pb-text2)' }}>
          <span title="צפיות">👁 {project.view_count}</span>
          <span title="קליקי יצירת קשר">📞 {project.contact_clicks}</span>
          <span title="קליקי WhatsApp">💬 {project.whatsapp_clicks}</span>
        </div>

        <p className="text-xs" style={{ color: 'var(--pb-border)' }}>{fmtDate(project.created_at)}</p>

        {/* Status — mark sold / rented so callers stop calling */}
        <div className="flex items-center gap-2">
          <span className="text-xs flex-shrink-0" style={{ color: 'var(--pb-text2)' }}>סטטוס:</span>
          <select
            value={project.status}
            onChange={(e) => onSetStatus(project.code, e.target.value as PropertyStatus)}
            aria-label="סטטוס הנכס"
            className="flex-1 text-xs font-semibold rounded-lg py-1.5 px-2 cursor-pointer"
            style={{
              background: isClosed ? '#fef2f2' : 'var(--pb-surface2)',
              color: isClosed ? '#b91c1c' : 'var(--pb-text)',
              border: `1px solid ${isClosed ? '#fecaca' : 'var(--pb-border)'}`,
            }}
          >
            <option value="available">🟢 פעיל — זמין</option>
            <option value="sold">🔴 נמכר</option>
            <option value="rented">🔴 הושכר</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-1" style={{ borderTop: '1px solid var(--pb-border)' }}>
          <a
            href={`/preview/${project.code}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs font-semibold py-1.5 rounded-lg transition-colors"
            style={{ background: 'color-mix(in srgb, var(--pb-accent) 12%, transparent)', color: 'var(--pb-accent)' }}
          >
            צפה
          </a>

          {/* Publish toggle */}
          <button
            type="button"
            onClick={() => onToggle(project.code, project.is_published)}
            className={`flex-1 text-center text-xs font-semibold py-1.5 rounded-lg transition-colors ${
              project.is_published
                ? 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            {project.is_published ? 'הסר מהשוק' : 'פרסם'}
          </button>

          <button
            type="button"
            onClick={() => onDelete(project.code, project.title)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--pb-text2)' }}
            title="מחק"
            aria-label="מחק נכס"
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserDashboard({ projects: initial, userName }: Props) {
  const [projects, setProjects] = useState<UserProject[]>(initial);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  async function toggle(code: string, current: boolean) {
    setPending((p) => ({ ...p, [code]: true }));
    try {
      const res = await fetch('/api/my-projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, isPublished: !current }),
      });
      if (res.ok) {
        setProjects((prev) =>
          prev.map((p) => p.code === code ? { ...p, is_published: !current } : p)
        );
      }
    } finally {
      setPending((p) => ({ ...p, [code]: false }));
    }
  }

  async function setStatus(code: string, status: PropertyStatus) {
    const prev = projects.find((p) => p.code === code)?.status ?? 'available';
    if (status === prev) return;
    // Optimistic update
    setProjects((list) => list.map((p) => (p.code === code ? { ...p, status } : p)));
    setPending((p) => ({ ...p, [code]: true }));
    try {
      const res = await fetch('/api/project-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, status }),
      });
      if (!res.ok) {
        // Roll back on failure
        setProjects((list) => list.map((p) => (p.code === code ? { ...p, status: prev } : p)));
      }
    } catch {
      setProjects((list) => list.map((p) => (p.code === code ? { ...p, status: prev } : p)));
    } finally {
      setPending((p) => ({ ...p, [code]: false }));
    }
  }

  async function del(code: string, title: string | null) {
    if (!confirm(`למחוק את "${title ?? code}"? לא ניתן לבטל.`)) return;
    setPending((p) => ({ ...p, [code]: true }));
    try {
      const res = await fetch('/api/my-projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (res.ok) setProjects((prev) => prev.filter((p) => p.code !== code));
    } finally {
      setPending((p) => ({ ...p, [code]: false }));
    }
  }

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: 'var(--pb-bg)' }}>
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between" style={{ background: 'var(--pb-surface)', borderBottom: '1px solid var(--pb-border)' }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--pb-text)' }}>הנכסים שלי</h1>
          {userName && <p className="text-xs" style={{ color: 'var(--pb-text2)' }}>{userName}</p>}
        </div>
        <a
          href="/builder"
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + נכס חדש
        </a>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {projects.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20 space-y-4">
            <div className="text-6xl">🏠</div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--pb-text)' }}>עדיין אין נכסים שמורים</h2>
            <p className="text-sm" style={{ color: 'var(--pb-text2)' }}>צור את דף הנחיתה הראשון שלך — לוקח פחות מ-5 דקות</p>
            <a
              href="/builder"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              התחל עכשיו
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {projects.map((p) => (
              <div key={p.code} className={pending[p.code] ? 'opacity-60 pointer-events-none' : ''}>
                <ProjectCard project={p} onToggle={toggle} onDelete={del} onSetStatus={setStatus} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
