import { redirect } from 'next/navigation';
import { auth, isAdmin, ADMIN_EMAILS } from '@/auth';
import { sql, hasDb } from '@/lib/db';
import AdminDashboard, {
  type AdminStats,
  type AdminProject,
  type AdminUser,
  type DailyPoint,
  type ActivityItem,
  type FeedbackItem,
} from '@/components/admin/AdminDashboard';

export const dynamic = 'force-dynamic';

async function fetchStats(): Promise<AdminStats> {
  // total_views = unique visitors (distinct sessions), excluding admin/self views.
  const rows = await sql!`
    SELECT
      (SELECT COUNT(*) FROM projects)::int                                    AS total_projects,
      (SELECT COUNT(*) FROM projects WHERE expires_at IS NULL OR expires_at > now())::int AS active_projects,
      (SELECT COUNT(*) FROM users)::int                                       AS total_users,
      (SELECT COUNT(DISTINCT viewer_session_id) FROM project_views
         WHERE viewer_email IS NULL OR NOT (viewer_email = ANY(${ADMIN_EMAILS}::text[])))::int AS total_views,
      (SELECT COUNT(*) FROM project_views
         WHERE contact_clicked = true
           AND (viewer_email IS NULL OR NOT (viewer_email = ANY(${ADMIN_EMAILS}::text[]))))::int AS contact_clicks,
      (SELECT COUNT(*) FROM project_views
         WHERE whatsapp_clicked = true
           AND (viewer_email IS NULL OR NOT (viewer_email = ANY(${ADMIN_EMAILS}::text[]))))::int AS whatsapp_clicks
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
      p.status,
      p.created_at,
      p.expires_at,
      u.email AS user_email,
      COUNT(pv.id)::int                                             AS view_count,
      SUM(CASE WHEN pv.contact_clicked  THEN 1 ELSE 0 END)::int    AS contact_clicks,
      SUM(CASE WHEN pv.whatsapp_clicked THEN 1 ELSE 0 END)::int    AS whatsapp_clicks
    FROM projects p
    LEFT JOIN users u ON u.id = p.user_id
    LEFT JOIN project_views pv ON pv.project_code = p.code
      AND (pv.viewer_email IS NULL OR NOT (pv.viewer_email = ANY(${ADMIN_EMAILS}::text[])))
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

async function fetchDailyStats(): Promise<DailyPoint[]> {
  const rows = await sql!`
    WITH days AS (
      SELECT generate_series(
        (NOW() - INTERVAL '29 days')::date,
        NOW()::date,
        '1 day'::interval
      )::date AS day
    ),
    proj AS (
      SELECT DATE(created_at) AS day, COUNT(*)::int AS n
      FROM projects
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1
    ),
    vw AS (
      SELECT
        DATE(created_at) AS day,
        COUNT(*)::int AS n,
        SUM(CASE WHEN contact_clicked  THEN 1 ELSE 0 END)::int AS cc,
        SUM(CASE WHEN whatsapp_clicked THEN 1 ELSE 0 END)::int AS wc
      FROM project_views
      WHERE created_at >= NOW() - INTERVAL '30 days'
        AND (viewer_email IS NULL OR NOT (viewer_email = ANY(${ADMIN_EMAILS}::text[])))
      GROUP BY 1
    )
    SELECT
      d.day::text                         AS day,
      COALESCE(proj.n, 0)::int            AS projects,
      COALESCE(vw.n, 0)::int              AS views,
      (COALESCE(vw.cc,0)+COALESCE(vw.wc,0))::int AS contact_clicks
    FROM days d
    LEFT JOIN proj ON proj.day = d.day
    LEFT JOIN vw   ON vw.day   = d.day
    ORDER BY d.day
  `;
  return rows as DailyPoint[];
}

async function fetchFeedback(): Promise<FeedbackItem[]> {
  const rows = await sql!`
    SELECT id, type, message, contact, user_email, screenshot,
           status, resolved_at, admin_reply, replied_at, created_at
    FROM feedback
    ORDER BY
      CASE WHEN status = 'open' THEN 0 ELSE 1 END,
      created_at DESC
    LIMIT 100
  `;
  return rows as FeedbackItem[];
}

async function fetchActivity(): Promise<ActivityItem[]> {
  const rows = await sql!`
    SELECT type, ref, label, user_email, ts FROM (
      SELECT
        'project_created'              AS type,
        p.code                         AS ref,
        COALESCE(p.title, p.code)      AS label,
        u.email                        AS user_email,
        p.created_at                   AS ts
      FROM projects p
      LEFT JOIN users u ON u.id = p.user_id

      UNION ALL

      SELECT
        'user_joined',
        u.id::text,
        u.email,
        u.email,
        u.created_at
      FROM users u

      UNION ALL

      SELECT
        CASE
          WHEN pv.contact_clicked  AND NOT pv.whatsapp_clicked THEN 'contact_click'
          WHEN pv.whatsapp_clicked AND NOT pv.contact_clicked  THEN 'whatsapp_click'
          WHEN pv.contact_clicked  AND pv.whatsapp_clicked     THEN 'contact_click'
          ELSE 'view'
        END,
        pv.project_code,
        pv.project_code,
        NULL,
        pv.created_at
      FROM project_views pv
      WHERE pv.viewer_email IS NULL OR NOT (pv.viewer_email = ANY(${ADMIN_EMAILS}::text[]))
    ) x
    ORDER BY ts DESC
    LIMIT 60
  `;
  return rows as ActivityItem[];
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

  // Each query is isolated: a single failure (e.g. a not-yet-run migration or a
  // missing table) degrades that section instead of 500'ing the whole dashboard.
  const emptyStats: AdminStats = {
    total_projects: 0, active_projects: 0, total_users: 0,
    total_views: 0, contact_clicks: 0, whatsapp_clicks: 0,
  };
  const onErr = (label: string) => (err: unknown) => {
    console.error(`[admin] ${label} query failed:`, err instanceof Error ? err.message : err);
  };
  const [stats, projects, users, daily, activity, feedback] = await Promise.all([
    fetchStats().catch((e) => { onErr('stats')(e); return emptyStats; }),
    fetchProjects().catch((e) => { onErr('projects')(e); return []; }),
    fetchUsers().catch((e) => { onErr('users')(e); return []; }),
    fetchDailyStats().catch((e) => { onErr('daily')(e); return []; }),
    fetchActivity().catch((e) => { onErr('activity')(e); return []; }),
    fetchFeedback().catch((e) => { onErr('feedback')(e); return []; }),
  ]);

  return (
    <AdminDashboard
      stats={stats}
      projects={projects}
      users={users}
      daily={daily}
      activity={activity}
      feedback={feedback}
      adminEmail={adminEmail}
    />
  );
}
