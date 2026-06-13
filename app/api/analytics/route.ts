import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getAgencyStats,
  getAgencyTimeSeries,
  getListingStats,
  getAgencyFunnel,
  getLeadCountsByListing,
} from '@/lib/db/queries/analytics'
import { getListingsByAgency } from '@/lib/db/queries/listings'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agencyId = session.user.agencyId
  const rawDays = parseInt(req.nextUrl.searchParams.get('days') ?? '30', 10)
  const days = Number.isFinite(rawDays) ? Math.min(Math.max(rawDays, 1), 90) : 30

  const [stats, timeSeries, listingStats, listings, funnel, leadCounts] = await Promise.all([
    getAgencyStats(agencyId, days),
    getAgencyTimeSeries(agencyId, days),
    getListingStats(agencyId, days),
    getListingsByAgency(agencyId),
    getAgencyFunnel(agencyId, days),
    getLeadCountsByListing(agencyId, days),
  ])

  // Merge listing titles + lead counts into stats rows
  const listingMap = Object.fromEntries(
    listings.map(l => [l.id, { title: l.ai_title ?? l.title ?? 'ללא שם', slug: l.slug }])
  )

  const enrichedListingStats = listingStats.map(r => ({
    ...r,
    title: listingMap[r.listing_id]?.title ?? r.listing_id,
    slug: listingMap[r.listing_id]?.slug ?? '',
    leads: leadCounts[r.listing_id] ?? 0,
  }))

  return NextResponse.json({ stats, timeSeries, listingStats: enrichedListingStats, funnel, days })
}
