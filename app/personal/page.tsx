import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getListingsByUser } from '@/lib/db/queries/listings'
import { getActivePendingCountsByListings } from '@/lib/db/queries/pending-changes'
import { getPersonalUserByEmail, upsertPersonalUser } from '@/lib/db/queries/personal-users'
import { ensureSchema } from '@/lib/db/ensure-schema'
import Link from 'next/link'
import type { Listing } from '@/lib/db/types'

function statusLabel(s: Listing['status']) {
  if (s === 'active') return { text: 'פעיל', cls: 'bg-green-100 text-green-700' }
  if (s === 'paused') return { text: 'מושהה', cls: 'bg-yellow-100 text-yellow-700' }
  return { text: 'נמכר', cls: 'bg-gray-100 text-gray-500' }
}

export default async function PersonalDashboard() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/personal')

  let personalUserId = session.user?.personalUserId

  // Recovery path: if the session callback didn't manage to set personalUserId
  // (e.g. DB was unreachable on that request), try once more here before failing.
  if (!personalUserId && session.user?.email) {
    await ensureSchema().catch(() => {})
    let pu = await getPersonalUserByEmail(session.user.email).catch(() => null)
    if (!pu) {
      pu = await upsertPersonalUser({
        email: session.user.email,
        name: session.user.name ?? null,
        photo_url: session.user.image ?? null,
      }).catch(() => null)
    }
    personalUserId = pu?.id
  }

  if (!personalUserId) {
    redirect('/auth/error?error=PersonalUserSetupFailed')
  }

  const listings = await getListingsByUser(personalUserId)
  const pendingCounts = await getActivePendingCountsByListings(listings.map(l => l.id))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">הנכסים שלי</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            שלום{session.user.name ? `, ${session.user.name}` : ''}
          </p>
        </div>
        <Link
          href="/builder"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          + נכס חדש
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="text-4xl mb-4">🏠</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">עדיין אין נכסים</h2>
          <p className="text-gray-500 mb-6">צור דף נחיתה מקצועי לנכס שלך בחינם תוך דקות</p>
          <Link
            href="/builder"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            צור דף עכשיו
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {listings.map((listing) => {
            const st = statusLabel(listing.status)
            const pending = pendingCounts[listing.id] ?? 0
            return (
              <div
                key={listing.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4"
              >
                {listing.hero_image_url ? (
                  <img
                    src={listing.hero_image_url}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="text-2xl">🏠</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">
                    {listing.ai_title || listing.title || listing.street || 'ללא כותרת'}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5 truncate">
                    {[listing.street, listing.city].filter(Boolean).join(', ') || '—'}
                  </div>
                  <span className={`inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>
                    {st.text}
                  </span>
                </div>
                <div className="flex flex-col gap-2 shrink-0 items-end">
                  <Link
                    href={`/builder?id=${listing.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    ערוך
                  </Link>
                  <a
                    href={`/p/${listing.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:underline"
                  >
                    צפה
                  </a>
                  <Link
                    href={`/personal/listings/${listing.id}/review`}
                    className={`text-xs rounded-lg px-2.5 py-1 font-medium transition-colors ${
                      pending > 0
                        ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                        : 'text-gray-400 hover:text-gray-600 border border-gray-200'
                    }`}
                  >
                    {pending > 0 ? `${pending} שינויים` : 'מוכר'}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Help / tutorials */}
      <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">❓</div>
          <div>
            <div className="font-semibold text-gray-900">צריך עזרה?</div>
            <div className="text-sm text-gray-600 mt-0.5">
              מדריך שימוש, שאלות נפוצות, ו-3 צעדים פשוטים למכירה
            </div>
          </div>
        </div>
        <Link
          href="/personal/help"
          className="shrink-0 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
        >
          למרכז העזרה
        </Link>
      </div>

      {/* Upgrade CTA */}
      <div className="mt-4 bg-gradient-to-l from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 flex items-center justify-between gap-4">
        <div>
          <div className="font-semibold text-gray-900">מתווך או סוכן נדל״ן?</div>
          <div className="text-sm text-gray-600 mt-0.5">
            שדרג לחשבון מקצועי — ניהול צוות, לידים, תובנות חכמות ועוד
          </div>
        </div>
        <Link
          href="/upgrade"
          className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
        >
          שדרג עכשיו
        </Link>
      </div>
    </div>
  )
}
