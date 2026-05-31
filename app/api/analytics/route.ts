import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getAgencyStats,
  getAgencyTimeSeries,
  getListingStats,
} from '@/lib/db/queries/analytics'
import { getListingsByAgency } from '@/lib/db/queries/listings'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agencyId = session.user.agencyId
  const days = Math.min(parseInt(req.nextUrl.searchParams.get('days') ?? '30', 10), 90)

  const [stats, timeSeries, listingStats, listings] = await Promise.all([
    getAgencyStats(agencyId, days),
    getAgencyTimeSeries(agencyId, days),
    getListingStats(agencyId, days),
    getListingsByAgency(agencyId),
  ])

  // Merge listing titles into stats rows
  const listingMap = Object.fromEntries(
    listings.map(l => [l.id, { title: l.ai_title ?? l.title ?? 'ללא שם', slug: l.slug }])
  )

  const enrichedListingStats = listingStats.map(r => ({
    ...r,
    title: listingMap[r.listing_id]?.title ?? r.listing_id,
    slug: listingMap[r.listing_id]?.slug ?? '',
  }))

  return NextResponse.json({ stats, timeSeries, listingStats: enrichedListingStats, days })
}
