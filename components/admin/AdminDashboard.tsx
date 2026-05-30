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
  status: string; // 'available' | 'sold' | 'rented'
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

export interface FeedbackItem {
  id: number;
  type: 'bug' | 'suggestion';
  message: string;
  contact: string | null;
  user_email: string | null;
  screenshot: string | null;
  status: 'open' | 'done';
  resolved_at: string | null;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

export interface DailyPoint {
  day: string;
  projects: number;
  views: number;
  contact_clicks: number;
}

export interface ActivityItem {
  type: 'project_created' | 'user_joined' | 'view' | 'contact_click' | 'whatsapp_click';
  ref: string;
  label: string | null;
  user_email: string | null;
  ts: string;
}

interface Props {
  stats: AdminStats;
  projects: AdminProject[];
  users: AdminUser[];
  daily: DailyPoint[];
  activity: ActivityItem[];
  feedback: FeedbackItem[];
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

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'עכשיו';
  if (diffMin < 60) return `לפני ${diffMin} דק׳`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `לפני ${diffH} שעות`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `לפני ${diffD} ימים`;
  return fmtDate(iso);
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

function BarChart({ data }: { data: DailyPoint[] }) {
  const [tooltip, setTooltip] = useState<{ idx: number; x: number } | null>(null);

  const maxViews = Math.max(...data.map((d) => d.views), 1);
  const maxProjects = Math.max(...data.map((d) => d.projects), 1);
  const CHART_H = 80;

  const labelIndices = [0, 9, 19, 29].filter((i) => i < data.length);

  return (
    <div className="space-y-6">
      {/* Views + clicks chart */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-3">צפיות וקליקי יצירת קשר — 30 יום אחרון</p>
        <div className="relative">
          <div
            className="flex items-end gap-px"
            style={{ height: CHART_H }}
            onMouseLeave={() => setTooltip(null)}
          >
            {data.map((d, i) => {
              const viewH = Math.max(Math.round((d.views / maxViews) * CHART_H), d.views > 0 ? 2 : 0);
              const clickH = Math.max(Math.round((d.contact_clicks / maxViews) * CHART_H), d.contact_clicks > 0 ? 2 : 0);
              return (
                <div
                  key={d.day}
                  className="flex-1 flex flex-col justify-end relative cursor-pointer group"
                  style={{ height: CHART_H }}
                  onMouseEnter={(e) => setTooltip({ idx: i, x: e.currentTarget.getBoundingClientRect().left })}
                >
                  <div style={{ height: viewH }} className="bg-blue-200 group-hover:bg-blue-300 rounded-t transition-colors w-full" />
                  {clickH > 0 && (
                    <div style={{ height: clickH, position: 'absolute', bottom: 0, left: 0, right: 0 }} className="bg-green-400 group-hover:bg-green-500 rounded-t transition-colors" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Tooltip */}
          {tooltip !== null && data[tooltip.idx] && (
            <div
              className="absolute -top-16 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 pointer-events-none z-10 whitespace-nowrap"
              style={{ left: `${(tooltip.idx / data.length) * 100}%`, transform: 'translateX(-50%)' }}
            >
              <div className="font-semibold">{data[tooltip.idx].day.slice(5)}</div>
              <div>👁 {data[tooltip.idx].views} צפיות</div>
              <div>📞 {data[tooltip.idx].contact_clicks} קליקים</div>
            </div>
          )}
        </div>

        {/* X-axis labels */}
        <div className="flex mt-1 text-xs text-gray-300">
          {data.map((d, i) => (
            <div key={d.day} className="flex-1 text-center">
              {labelIndices.includes(i) ? d.day.slice(5) : ''}
            </div>
          ))}
        </div>

        <div className="flex gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-sm bg-blue-200 inline-block" />
            צפיות
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-sm bg-green-400 inline-block" />
            קליקי יצירת קשר
          </span>
        </div>
      </div>

      {/* Projects created chart */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-3">פרויקטים חדשים — 30 יום אחרון</p>
        <div className="flex items-end gap-px" style={{ height: 40 }}>
          {data.map((d) => {
            const h = Math.max(Math.round((d.projects / maxProjects) * 40), d.projects > 0 ? 3 : 0);
            return (
              <div
                key={d.day}
                className="flex-1 bg-purple-300 hover:bg-purple-400 rounded-t transition-colors cursor-default"
                style={{ height: h }}
                title={`${d.day.slice(5)}: ${d.projects} פרויקטים`}
              />
            );
          })}
        </div>
        <div className="flex mt-1 text-xs text-gray-300">
          {data.map((d, i) => (
            <div key={d.day} className="flex-1 text-center">
              {labelIndices.includes(i) ? d.day.slice(5) : ''}
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-sm bg-purple-300 inline-block" />
            פרויקטים חדשים
          </span>
        </div>
      </div>
    </div>
  );
}

const ACTIVITY_ICONS: Record<string, string> = {
  project_created: '🏠',
  user_joined: '👤',
  view: '👁',
  contact_click: '📞',
  whatsapp_click: '💬',
};

const ACTIVITY_LABELS: Record<string, string> = {
  project_created: 'פרויקט חדש',
  user_joined: 'משתמש חדש',
  view: 'צפייה בדף',
  contact_click: 'קליק יצירת קשר',
  whatsapp_click: 'קליק WhatsApp',
};

const ACTIVITY_COLORS: Record<string, string> = {
  project_created: 'bg-purple-50 border-purple-100',
  user_joined: 'bg-blue-50 border-blue-100',
  view: 'bg-white border-gray-100',
  contact_click: 'bg-green-50 border-green-100',
  whatsapp_click: 'bg-green-50 border-green-100',
};

export default function AdminDashboard({ stats, projects: initialProjects, users, daily, activity, feedback: initialFeedback, adminEmail }: Props) {
  const [tab, setTab] = useState<'projects' | 'users' | 'history' | 'feedback'>('projects');
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>(initialFeedback);
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyError, setReplyError] = useState('');
  const [pendingFeedback, setPendingFeedback] = useState<Record<number, boolean>>({});
  const [showResolved, setShowResolved] = useState(false);

  const openItems = feedbackItems.filter((f) => f.status === 'open');
  const doneItems = feedbackItems.filter((f) => f.status === 'done');

  async function resolve(id: number) {
    setPendingFeedback((p) => ({ ...p, [id]: true }));
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'resolve' }),
      });
      if (res.ok) {
        setFeedbackItems((prev) =>
          prev.map((f) => f.id === id ? { ...f, status: 'done', resolved_at: new Date().toISOString() } : f)
        );
        setReplyingId(null);
      }
    } finally {
      setPendingFeedback((p) => ({ ...p, [id]: false }));
    }
  }

  async function reopen(id: number) {
    setPendingFeedback((p) => ({ ...p, [id]: true }));
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reopen' }),
      });
      if (res.ok) {
        setFeedbackItems((prev) =>
          prev.map((f) => f.id === id ? { ...f, status: 'open', resolved_at: null } : f)
        );
      }
    } finally {
      setPendingFeedback((p) => ({ ...p, [id]: false }));
    }
  }

  async function sendReply(id: number) {
    if (!replyText.trim()) return;
    setReplyError('');
    setPendingFeedback((p) => ({ ...p, [id]: true }));
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reply', reply: replyText.trim() }),
      });
      const data = await res.json() as { ok?: boolean; error?: string; message?: string };
      if (res.ok) {
        setFeedbackItems((prev) =>
          prev.map((f) =>
            f.id === id
              ? { ...f, status: 'done', resolved_at: new Date().toISOString(), admin_reply: replyText.trim(), replied_at: new Date().toISOString() }
              : f
          )
        );
        setReplyingId(null);
        setReplyText('');
      } else {
        setReplyError(
          data.error === 'email_not_configured'
            ? 'שליחת מייל לא מוגדרת — הוסף RESEND_API_KEY ל-Vercel'
            : `שגיאה בשליחה: ${data.message ?? data.error}`
        );
      }
    } catch {
      setReplyError('שגיאת רשת, נסה שוב');
    } finally {
      setPendingFeedback((p) => ({ ...p, [id]: false }));
    }
  }
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'sold' | 'rented'>('all');
  const [projects, setProjects] = useState<AdminProject[]>(initialProjects);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const filtered = projects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
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
          {(['projects', 'users', 'history', 'feedback'] as const).map((t) => (
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
              {t === 'projects' ? `פרויקטים (${projects.length})` :
               t === 'users'    ? `משתמשים (${users.length})` :
               t === 'history'  ? 'היסטוריה' :
               `משוב ${openItems.length > 0 ? `(${openItems.length})` : ''}`}
            </button>
          ))}
        </div>

        {/* Projects tab */}
        {tab === 'projects' && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="search"
                placeholder="חיפוש לפי קוד / כותרת / עיר / מייל..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 min-w-[200px] max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                aria-label="סנן לפי סטטוס"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">כל הסטטוסים</option>
                <option value="available">🟢 פעיל</option>
                <option value="sold">🔴 נמכר</option>
                <option value="rented">🔴 הושכר</option>
              </select>
            </div>

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
                          <div className="font-medium text-gray-900 truncate max-w-[180px] flex items-center gap-1.5">
                            {p.title ?? '—'}
                            {p.status === 'sold' && (
                              <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">נמכר</span>
                            )}
                            {p.status === 'rented' && (
                              <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">הושכר</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            {[p.city, p.rooms ? `${p.rooms} חד׳` : null].filter(Boolean).join(' · ')}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtPrice(p)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs truncate max-w-[140px]">
                          {p.user_email ?? <span className="text-gray-300">אנונימי</span>}
                          {isExpired && <span className="me-1 text-red-400">(פג)</span>}
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

        {/* History tab */}
        {tab === 'history' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Charts */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-5">גרפים יומיים</h2>
              <BarChart data={daily} />
            </div>

            {/* Activity feed */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-800">פעילות אחרונה</h2>
                <p className="text-xs text-gray-400 mt-0.5">60 האירועים האחרונים</p>
              </div>
              <div className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
                {activity.length === 0 && (
                  <p className="text-center text-gray-400 py-10 text-sm">אין פעילות עדיין</p>
                )}
                {activity.map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 px-5 py-3 border-r-2 ${ACTIVITY_COLORS[item.type]}`}
                  >
                    <span className="text-lg leading-none mt-0.5 flex-shrink-0">
                      {ACTIVITY_ICONS[item.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700">
                        {ACTIVITY_LABELS[item.type]}
                        {item.type === 'project_created' && item.label && (
                          <a
                            href={`/preview/${item.ref}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline font-normal mr-1"
                          >
                            {item.label}
                          </a>
                        )}
                        {(item.type === 'view' || item.type === 'contact_click' || item.type === 'whatsapp_click') && (
                          <a
                            href={`/preview/${item.ref}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:underline font-mono text-xs font-normal mr-1"
                          >
                            {item.ref}
                          </a>
                        )}
                      </p>
                      {item.user_email && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{item.user_email}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                      {fmtTime(item.ts)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Feedback tab */}
        {tab === 'feedback' && (
          <div className="space-y-3">
            {feedbackItems.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 px-6 py-12 text-center text-gray-400">
                אין משוב עדיין
              </div>
            )}

            {/* Open items */}
            {openItems.map((item) => {
              const replyEmail = item.contact?.includes('@') ? item.contact : item.user_email?.includes('@') ? item.user_email : null;
              const isReplying = replyingId === item.id;
              const busy = pendingFeedback[item.id];
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl border px-5 py-4 space-y-3 ${
                    item.type === 'bug' ? 'border-red-100' : 'border-blue-100'
                  }`}
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        item.type === 'bug' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {item.type === 'bug' ? '🐛 באג' : '💡 הצעה'}
                      </span>
                      <span className="text-xs text-gray-400">{fmtTime(item.created_at)}</span>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {replyEmail && (
                        <button
                          type="button"
                          onClick={() => { setReplyingId(isReplying ? null : item.id); setReplyText(''); }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          ↩ ענה
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void resolve(item.id)}
                        className="text-xs text-green-700 hover:text-green-900 font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-40"
                      >
                        ✓ סמן כטופל
                      </button>
                    </div>
                  </div>

                  {/* Message */}
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{item.message}</p>

                  {/* Screenshot */}
                  {item.screenshot && (
                    <button type="button" onClick={() => setLightbox(item.screenshot)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.screenshot} alt="צילום מסך" className="max-h-40 rounded-lg border border-gray-200 object-cover hover:opacity-90 transition-opacity cursor-zoom-in" />
                    </button>
                  )}

                  {/* Contact */}
                  {(item.contact || item.user_email) && (
                    <p className="text-xs text-gray-400">
                      ✉ {item.contact || item.user_email}
                      {item.contact && item.user_email && item.contact !== item.user_email && (
                        <span className="text-gray-300"> · חשבון: {item.user_email}</span>
                      )}
                    </p>
                  )}

                  {/* Inline reply composer */}
                  {isReplying && (
                    <div className="border-t border-gray-100 pt-3 space-y-2">
                      <p className="text-xs font-medium text-gray-600">תשובה אל {replyEmail}</p>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="כתוב תשובה..."
                        rows={3}
                        autoFocus
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      {replyError && (
                        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{replyError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={!replyText.trim() || busy}
                          onClick={() => void sendReply(item.id)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                        >
                          {busy ? 'שולח...' : '↩ שלח תשובה'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setReplyingId(null); setReplyText(''); setReplyError(''); }}
                          className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          ביטול
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Done / resolved section */}
            {doneItems.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowResolved((v) => !v)}
                  className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 font-medium mb-3 transition-colors"
                >
                  <span className={`transition-transform ${showResolved ? 'rotate-90' : ''}`}>▶</span>
                  {showResolved ? 'הסתר' : 'הצג'} טופל ({doneItems.length})
                </button>

                {showResolved && (
                  <div className="space-y-2">
                    {doneItems.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-xl border border-gray-100 px-5 py-3 space-y-2 opacity-70">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                              {item.type === 'bug' ? '🐛 באג' : '💡 הצעה'}
                            </span>
                            <span className="text-xs text-gray-400">{fmtTime(item.created_at)}</span>
                            {item.replied_at && (
                              <span className="text-xs text-green-600 font-medium">✉ נענה</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => void reopen(item.id)}
                            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            פתח מחדש
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 whitespace-pre-wrap line-clamp-2">{item.message}</p>
                        {item.admin_reply && (
                          <div className="border-r-2 border-blue-200 pr-3 text-xs text-gray-500 italic">
                            תשובתך: {item.admin_reply}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Screenshot lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="צילום מסך"
            className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full w-9 h-9 flex items-center justify-center text-lg transition-colors"
            aria-label="סגור"
          >×</button>
        </div>
      )}
    </div>
  );
}
