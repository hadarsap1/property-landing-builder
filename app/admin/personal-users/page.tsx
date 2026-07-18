import { getAllPersonalUsers } from '@/lib/db/queries/personal-users'
import { sql } from '@/lib/db'
import { DeleteUserButton } from './_delete-button'

interface ListingCount { user_id: string; count: string }

export default async function AdminPersonalUsersPage() {
  const [users, countRows] = await Promise.all([
    getAllPersonalUsers(),
    sql<ListingCount>`
      SELECT user_id, COUNT(*)::text AS count
      FROM listings
      WHERE user_id IS NOT NULL
      GROUP BY user_id
    `.then(r => r.rows),
  ])

  const countMap = Object.fromEntries(countRows.map(r => [r.user_id, r.count]))

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">משתמשים פרטיים ({users.length})</h1>

      {users.length === 0 ? (
        <p className="text-gray-400">אין משתמשים פרטיים עדיין</p>
      ) : (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-gray-700">
                <th className="text-right px-5 py-3 font-medium">שם</th>
                <th className="text-right px-5 py-3 font-medium">מייל</th>
                <th className="text-right px-5 py-3 font-medium">תוכנית</th>
                <th className="text-right px-5 py-3 font-medium">נכסים</th>
                <th className="text-right px-5 py-3 font-medium">נוצר</th>
                <th className="text-right px-5 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-750 text-gray-200">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {u.photo_url && (
                        <img src={u.photo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                      )}
                      <span>{u.name ?? <span className="text-gray-500">—</span>}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{u.email ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.plan === 'commercial'
                        ? 'bg-blue-900 text-blue-300'
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {u.plan === 'commercial' ? 'מסחרי' : 'חינמי'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center text-gray-300">
                    {countMap[u.id] ?? '0'}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {new Date(u.created_at).toLocaleDateString('he-IL')}
                  </td>
                  <td className="px-5 py-3">
                    <DeleteUserButton id={u.id} label={u.name ?? u.email ?? 'משתמש'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
