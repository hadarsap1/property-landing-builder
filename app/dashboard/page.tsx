import { auth } from '@/auth'
import { getListingsByAgency } from '@/lib/db/queries/listings'
import { getAgencyById } from '@/lib/db/queries/agencies'
import { getActivePendingCountsByListings } from '@/lib/db/queries/pending-changes'
import { getLeadsByAgency } from '@/lib/db/queries/leads'
import { getAgencyStats } from '@/lib/db/queries/analytics'
import Link from 'next/link'
import { ListingCard } from './_listing-card'
import type { Listing } from '@/lib/db/types'
import type { LeadWithListing } from '@/lib/db/queries/leads'
import type { AgencyStats } from '@/lib/db/queries/analytics'
import type { Agency } from '@/lib/db/types'

function DbErrorBanner({ message }: { message: string }) {
  const isDbError = message.includes('POSTGRES_URL') || message.includes('missing_connection_string') || message.includes('does not exist') || message.includes('Connection')
  return (
    <div className="text-center py-20 space-y-4" dir="rtl">
      <div className="text-4xl">⚠️</div>
      <p className="text-base font-semibold" style={{ color: '#111' }}>
        {isDbError ? 'מסד הנתונים אינו מחובר' : 'שגיאה בטעינת הנתונים'}
      </p>
      <p className="text-sm max-w-sm mx-auto" style={{ color: '#888' }}>
        {isDbError
          ? 'יש להגדיר את משתנה הסביבה POSTGRES_URL בהגדרות Vercel ולהריץ setup-db.'
          : message}
      </p>
      {isDbError && (
        <a
          href="https://vercel.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm hover:underline"
          style={{ color: '#c0392b' }}
        >
          פתח הגדרות Vercel ←
        </a>
      )}
    </div>
  )
}

export default async function DashboardPage() {
  const session = await auth()
  const agencyId = session?.user?.agencyId
  if (!agencyId) return null

  let listings: Listing[]
  let agency: Agency | null
  let leads: LeadWithListing[]
  let stats: AgencyStats | null
  let pendingCounts: Record<string, number>

  try {
    ;[listings, agency, leads, stats] = await Promise.all([
      getListingsByAgency(agencyId),
      getAgencyById(agencyId),
      getLeadsByAgency(agencyId).catch(() => [] as LeadWithListing[]),
      getAgencyStats(agencyId, 30).catch(() => null),
    ])
    pendingCounts = await getActivePendingCountsByListings(listings.map(l => l.id))
  } catch (err: unknown) {
    return <DbErrorBanner message={err instanceof Error ? err.message : String(err)} />
  }

  const newLeads = leads.filter(l => l.status === 'new').length
  const activeListings = listings.filter(l => l.status === 'active').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#111' }}>
            {agency?.name ?? 'הנכסים שלי'}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#888' }}>{listings.length} נכסים</p>
        </div>
        <Link
          href="/builder"
          className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          style={{ background: '#111', color: '#f7f5f2' }}
        >
          + נכס חדש
        </Link>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/dashboard/leads" className="rounded-2xl p-4 space-y-1 transition-colors" style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px' }}>
          <div className="text-xl">📬</div>
          <div className="text-2xl font-bold" style={{ color: '#111' }}>{leads.length}</div>
          <div className="text-xs" style={{ color: '#888' }}>לידים</div>
          {newLeads > 0 && (
            <div className="text-xs font-semibold" style={{ color: '#c0392b' }}>{newLeads} חדשים</div>
          )}
        </Link>

        <div className="rounded-2xl p-4 space-y-1" style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px' }}>
          <div className="text-xl">🏠</div>
          <div className="text-2xl font-bold" style={{ color: '#111' }}>{activeListings}</div>
          <div className="text-xs" style={{ color: '#888' }}>נכסים פעילים</div>
        </div>

        <Link href="/dashboard/analytics" className="rounded-2xl p-4 space-y-1 transition-colors" style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px' }}>
          <div className="text-xl">👁</div>
          <div className="text-2xl font-bold" style={{ color: '#111' }}>
            {(stats?.total_views ?? 0).toLocaleString('he-IL')}
          </div>
          <div className="text-xs" style={{ color: '#888' }}>צפיות (30י׳)</div>
        </Link>

        <Link href="/dashboard/analytics" className="rounded-2xl p-4 space-y-1 transition-colors" style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px' }}>
          <div className="text-xl">💬</div>
          <div className="text-2xl font-bold" style={{ color: '#111' }}>
            {((stats?.whatsapp_clicks ?? 0) + (stats?.phone_clicks ?? 0)).toLocaleString('he-IL')}
          </div>
          <div className="text-xs" style={{ color: '#888' }}>פניות (30י׳)</div>
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-20 space-y-4" style={{ color: '#aaa' }}>
          <div className="text-5xl">🏠</div>
          <div>
            <p className="text-base font-semibold" style={{ color: '#111' }}>אין נכסים עדיין</p>
            <p className="text-sm mt-1" style={{ color: '#888' }}>צור את דף הנחיתה הראשון שלך תוך כמה דקות</p>
          </div>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            style={{ background: '#111', color: '#f7f5f2' }}
          >
            + צור נכס ראשון
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              agencySlug={agency?.slug ?? ''}
              pendingChanges={pendingCounts[listing.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
