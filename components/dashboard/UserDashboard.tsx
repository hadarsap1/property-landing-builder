'use client';

import { useState } from 'react';

export interface UserProject {
  code: string;
  title: string | null;
  city: string | null;
  rooms: number | null;
  price: number | null;
  price_on_request: boolean;
  is_published: boolean;
  created_at: string;
  expires_at: string | null;
  hero_url: string | null;
  view_count: number;
  contact_clicks: number;
  whatsapp_clicks: number;
}

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
}: {
  project: UserProject;
  onToggle: (code: string, current: boolean) => void;
  onDelete: (code: string, title: string | null) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* Hero image */}
      <div className="relative h-40 bg-gray-100">
        {project.hero_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.hero_url} alt={project.title ?? ''} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">🏠</div>
        )}
        {/* Published badge */}
        <div className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
          project.is_published ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          {project.is_published ? '✓ מפורסם' : 'טיוטה'}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div>
          <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">
            {project.title ?? 'ללא כותרת'}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {[project.city, project.rooms ? `${project.rooms} חד׳` : null, fmtPrice(project)]
              .filter(Boolean).join(' · ')}
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-xs text-gray-500">
          <span title="צפיות">👁 {project.view_count}</span>
          <span title="קליקי יצירת קשר">📞 {project.contact_clicks}</span>
          <span title="קליקי WhatsApp">💬 {project.whatsapp_clicks}</span>
        </div>

        <p className="text-xs text-gray-300">{fmtDate(project.created_at)}</p>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-1 border-t border-gray-50">
          <a
            href={`/preview/${project.code}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs font-semibold py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
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
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="מחק"
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
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">הנכסים שלי</h1>
          {userName && <p className="text-xs text-gray-400">{userName}</p>}
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
            <h2 className="text-lg font-bold text-gray-800">עדיין אין נכסים שמורים</h2>
            <p className="text-sm text-gray-500">צור את דף הנחיתה הראשון שלך — לוקח פחות מ-5 דקות</p>
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
                <ProjectCard project={p} onToggle={toggle} onDelete={del} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
