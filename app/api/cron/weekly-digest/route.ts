import { NextResponse } from 'next/server'
import { getAllAgenciesForDigest } from '@/lib/db/queries/agencies'
import { getWeeklyDigestData } from '@/lib/db/queries/analytics'
import { sendWeeklyDigestEmail } from '@/lib/email'
import { agencyHost } from '@/lib/listings/seo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? 'property-landing-builder.vercel.app'
const APP_URL = process.env.NEXTAUTH_URL ?? `https://${ROOT_DOMAIN}`

export async function GET(req: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[weekly-digest] CRON_SECRET is not set — refusing request')
    return NextResponse.json({ error: 'Service misconfigured' }, { status: 503 })
  }
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agencies = await getAllAgenciesForDigest()

  let totalSent = 0
  let totalFailed = 0

  for (const agency of agencies) {
    let data
    try {
      data = await getWeeklyDigestData(agency.id)
    } catch (err) {
      console.error(`[weekly-digest] failed to fetch data for agency ${agency.id}:`, err)
      totalFailed += agency.agents.length
      continue
    }

    const host = agencyHost(agency)
    const dashboardUrl = `${APP_URL}/dashboard/analytics`

    const results = await Promise.allSettled(
      agency.agents.map((agent) =>
        sendWeeklyDigestEmail({
          to: agent.email,
          agentName: agent.name,
          agencyName: agency.name,
          dashboardUrl,
          data,
          agencyHost: host,
        })
      )
    )

    const sent = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length
    totalSent += sent
    totalFailed += failed

    if (failed > 0) {
      results.forEach((r, i) => {
        if (r.status === 'rejected')
          console.error(`[weekly-digest] agent ${agency.agents[i].id} failed:`, r.reason)
      })
    }
  }

  console.info(
    `[weekly-digest] agencies=${agencies.length} sent=${totalSent} failed=${totalFailed}`
  )
  return NextResponse.json({ agencies: agencies.length, sent: totalSent, failed: totalFailed })
}
