'use client';

import { useState } from 'react';

export interface AdminProject {
  code: string;
  title: string | null;
  city: string | null;
  rooms: number | null;
  price: number | null;
  price_on_request: boolean;
  is_published: boolean;
  created_at: string;
  expires_at: string | null;
  user_email: string | null;
  view_count: number;
  contact_clicks: number;
  whatsapp_clicks: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  project_count: number;
}

export interface AdminStats {
  total_projects: number;
  active_projects: number;
  total_users: number;
  total_views: number;
  contact_clicks: number;
  whatsapp_clicks: number;
}

interface Props {
  stats: AdminStats;
  projects: AdminProject[];
  users: AdminUser[];
  adminEmail: string;
}

function fmt(n: number | null): string {
  if (n == null) return '—';
  return n.toLocaleString('he-IL');
}

function fmtPrice(p: AdminProject): string {
  if (p.price_on_request) return 'לפי פנייה';
  if (!p.price) return '—';
  return `₪${(p.price / 1_000_000).toFixed(1)}M`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-xl p-4 border ${color}`}>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? fmt(value) : value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard({ stats, projects: initialProjects, users, adminEmail }: Props) {
  const [tab, setTab] = useState<'projects' | 'users'>('projects');
  const [search, setSearch] = useState('');
  const [projects, setProjects] = useState<AdminProject[]>(initialProjects);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const filtered = projects.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.code.includes(q) ||
      (p.title ?? '').toLowerCase().includes(q) ||
      (p.city ?? '').toLowerCase().includes(q) ||
      (p.user_email ?? '').toLowerCase().includes(q)
    );
  });

  async function togglePublish(code: string, current: boolean) {
    setPending((prev) => ({ ...prev, [code]: true }));
    try {
      const res = await fetch('/api/admin/projects', {
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
      setPending((prev) => ({ ...prev, [code]: false }));
    }
  }

  async function deleteProject(code: string, title: string | null) {
    if (!confirm(`למחוק את הפרויקט "${title ?? code}"? לא ניתן לבטל.`)) return;
    setPending((prev) => ({ ...prev, [code]: true }));
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.code !== code));
      }
    } finally {
      setPending((prev) => ({ ...prev, [code]: false }));
    }
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-xs text-gray-400">{adminEmail}</p>
        </div>
        <a
          href="/"
          className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5"
        >
          ← חזרה לאתר
        </a>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="פרויקטים" value={stats.total_projects} color="bg-white border-gray-200" />
          <StatCard label="פעילים" value={stats.active_projects} color="bg-white border-gray-200" />
          <StatCard label="משתמשים" value={stats.total_users} color="bg-blue-50 border-blue-100" />
          <StatCard label="צפיות" value={stats.total_views} color="bg-white border-gray-200" />
          <StatCard label="קליקי יצירת קשר" value={stats.contact_clicks} color="bg-green-50 border-green-100" />
          <StatCard label="קליקי WhatsApp" value={stats.whatsapp_clicks} color="bg-green-50 border-green-100" />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 flex gap-6">
          {(['projects', 'users'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'projects' ? `פרויקטים (${projects.length})` : `משתמשים (${users.length})`}
            </button>
          ))}
        </div>

        {/* Projects tab */}
        {tab === 'projects' && (
          <div className="space-y-3">
            <input
              type="search"
              placeholder="חיפוש לפי קוד / כותרת / עיר / מייל..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-right border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 font-medium text-gray-600">קוד</th>
                    <th className="px-4 py-3 font-medium text-gray-600">נכס</th>
                    <th className="px-4 py-3 font-medium text-gray-600">מחיר</th>
                    <th className="px-4 py-3 font-medium text-gray-600">משתמש</th>
                    <th className="px-4 py-3 font-medium text-gray-600">נוצר</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-center">👁</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-center">📞</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-center">💬</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-center">פורסם</th>
                    <th className="px-4 py-3 font-medium text-gray-600"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                        {search ? 'אין תוצאות' : 'אין פרויקטים עדיין'}
                      </td>
                    </tr>
                  )}
                  {filtered.map((p) => {
                    const isLoading = pending[p.code];
                    const isExpired = p.expires_at ? new Date(p.expires_at) < new Date() : false;
                    return (
                      <tr
                        key={p.code}
                        className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${isExpired ? 'opacity-50' : ''}`}
                      >
                        <td className="px-4 py-3 font-mono text-blue-600">
                          <a
                            href={`/preview/${p.code}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {p.code}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 truncate max-w-[180px]">
                            {p.title ?? '—'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {[p.city, p.rooms ? `${p.rooms} חד׳` : null].filter(Boolean).join(' · ')}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtPrice(p)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs truncate max-w-[140px]">
                          {p.user_email ?? <span className="text-gray-300">אנונימי</span>}
                          {isExpired && <span className="mr-1 text-red-400">(פג)</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fmtDate(p.created_at)}</td>
                        <td className="px-4 py-3 text-center text-gray-700">{fmt(p.view_count)}</td>
                        <td className="px-4 py-3 text-center text-gray-700">{fmt(p.contact_clicks)}</td>
                        <td className="px-4 py-3 text-center text-gray-700">{fmt(p.whatsapp_clicks)}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => void togglePublish(p.code, p.is_published)}
                            className={`w-10 h-5 rounded-full transition-colors relative ${
                              p.is_published ? 'bg-green-500' : 'bg-gray-300'
                            } ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
                            title={p.is_published ? 'פורסם — לחץ להסרה' : 'לא פורסם — לחץ לפרסום'}
                          >
                            <span
                              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                                p.is_published ? 'right-0.5' : 'left-0.5'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => void deleteProject(p.code, p.title)}
                            className="text-red-400 hover:text-red-600 disabled:opacity-30 text-xs"
                            title="מחק פרויקט"
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users tab */}
        {tab === 'users' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 font-medium text-gray-600">משתמש</th>
                  <th className="px-4 py-3 font-medium text-gray-600">מייל</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-center">פרויקטים</th>
                  <th className="px-4 py-3 font-medium text-gray-600">הצטרף</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">אין משתמשים רשומים עדיין</td>
                  </tr>
                )}
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.avatar_url} alt="" className="w-7 h-7 rounded-full" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                            {(u.name ?? u.email)[0].toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{u.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{fmt(u.project_count)}</td>
                    <td className="px-4 py-3 text-gray-400">{fmtDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
