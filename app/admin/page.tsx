import { redirect } from 'next/navigation';
import { auth, isAdmin } from '@/auth';
import { sql, hasDb } from '@/lib/db';
import AdminDashboard, { type AdminStats, type AdminProject, type AdminUser } from '@/components/admin/AdminDashboard';

export const dynamic = 'force-dynamic';

async function fetchStats(): Promise<AdminStats> {
  const rows = await sql!`
    SELECT
      (SELECT COUNT(*) FROM projects)::int                                    AS total_projects,
      (SELECT COUNT(*) FROM projects WHERE expires_at IS NULL OR expires_at > now())::int AS active_projects,
      (SELECT COUNT(*) FROM users)::int                                       AS total_users,
      (SELECT COUNT(*) FROM project_views)::int                               AS total_views,
      (SELECT COUNT(*) FROM project_views WHERE contact_clicked = true)::int  AS contact_clicks,
      (SELECT COUNT(*) FROM project_views WHERE whatsapp_clicked = true)::int AS whatsapp_clicks
  `;
  return rows[0] as AdminStats;
}

async function fetchProjects(): Promise<AdminProject[]> {
  const rows = await sql!`
    SELECT
      p.code,
      p.title,
      p.city,
      p.rooms::float AS rooms,
      p.price::float AS price,
      p.price_on_request,
      p.is_published,
      p.created_at,
      p.expires_at,
      u.email AS user_email,
      COUNT(pv.id)::int                                             AS view_count,
      SUM(CASE WHEN pv.contact_clicked  THEN 1 ELSE 0 END)::int    AS contact_clicks,
      SUM(CASE WHEN pv.whatsapp_clicked THEN 1 ELSE 0 END)::int    AS whatsapp_clicks
    FROM projects p
    LEFT JOIN users u ON u.id = p.user_id
    LEFT JOIN project_views pv ON pv.project_code = p.code
    GROUP BY p.id, u.email
    ORDER BY p.created_at DESC
    LIMIT 200
  `;
  return rows as AdminProject[];
}

async function fetchUsers(): Promise<AdminUser[]> {
  const rows = await sql!`
    SELECT
      u.id,
      u.email,
      u.name,
      u.avatar_url,
      u.created_at,
      COUNT(p.id)::int AS project_count
    FROM users u
    LEFT JOIN projects p ON p.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
    LIMIT 200
  `;
  return rows as AdminUser[];
}

export default async function AdminPage() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect('/');

  const adminEmail = session!.user!.email!;

  if (!hasDb()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-2">
          <div className="text-4xl">🔌</div>
          <h2 className="text-lg font-bold text-gray-800">בסיס נתונים לא מחובר</h2>
          <p className="text-sm text-gray-500">הגדר את DATABASE_URL כדי לראות נתוני אדמין</p>
          <a href="/" className="text-sm text-blue-600 hover:underline">חזרה לאתר</a>
        </div>
      </div>
    );
  }

  const [stats, projects, users] = await Promise.all([
    fetchStats(),
    fetchProjects(),
    fetchUsers(),
  ]);

  return (
    <AdminDashboard
      stats={stats}
      projects={projects}
      users={users}
      adminEmail={adminEmail}
    />
  );
}
