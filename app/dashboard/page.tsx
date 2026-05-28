import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { sql, hasDb } from '@/lib/db';
import UserDashboard, { type UserProject } from '@/components/dashboard/UserDashboard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/?signin=1');

  const userId = session.user.id;
  const userName = session.user.name ?? session.user.email ?? null;

  if (!hasDb()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-2">
          <div className="text-4xl">🔌</div>
          <h2 className="text-lg font-bold text-gray-800">מסד הנתונים לא מחובר</h2>
          <p className="text-sm text-gray-500">הגדר את DATABASE_URL כדי לשמור פרויקטים</p>
          <a href="/" className="text-sm text-blue-600 hover:underline">חזרה לדף הבית</a>
        </div>
      </div>
    );
  }

  const rows = await sql!`
    SELECT
      p.code,
      p.title,
      p.city,
      p.rooms::float           AS rooms,
      p.price::float           AS price,
      p.price_on_request,
      p.is_published,
      p.created_at,
      p.expires_at,
      COALESCE(
        (p.data->'images'->((COALESCE(p.data->>'heroImageIndex','0'))::int))->>'enhancedBlobUrl',
        (p.data->'images'->((COALESCE(p.data->>'heroImageIndex','0'))::int))->>'blobUrl',
        (p.data->'images'->0)->>'enhancedBlobUrl',
        (p.data->'images'->0)->>'blobUrl'
      )                        AS hero_url,
      COUNT(pv.id)::int        AS view_count,
      SUM(CASE WHEN pv.contact_clicked  THEN 1 ELSE 0 END)::int AS contact_clicks,
      SUM(CASE WHEN pv.whatsapp_clicked THEN 1 ELSE 0 END)::int AS whatsapp_clicks
    FROM projects p
    LEFT JOIN project_views pv ON pv.project_code = p.code
    WHERE p.user_id = ${userId}
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;

  return <UserDashboard projects={rows as UserProject[]} userName={userName} />;
}
