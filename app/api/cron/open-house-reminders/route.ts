import { NextResponse } from 'next/server'
import { getOpenHouseLeadsForTomorrow, markOpenHouseReminderSent } from '@/lib/db/queries/leads'
import { sendOpenHouseReminderEmail } from '@/lib/email'
import { listingCanonicalUrl } from '@/lib/listings/seo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[open-house-reminders] CRON_SECRET is not set — refusing request')
    return NextResponse.json({ error: 'Service misconfigured' }, { status: 503 })
  }
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const leads = await getOpenHouseLeadsForTomorrow()

  const results = await Promise.allSettled(
    leads.map(async (lead) => {
      await sendOpenHouseReminderEmail({
        to: lead.email!,
        name: lead.name,
        listingTitle: lead.listing_title ?? 'נכס',
        listingUrl: listingCanonicalUrl(
          { slug: lead.agency_slug, custom_domain: lead.agency_custom_domain },
          lead.listing_slug ?? ''
        ),
        openHouseDate: lead.open_house_date,
        street: lead.listing_street,
        city: lead.listing_city,
        agencyName: lead.agency_name,
      })
      await markOpenHouseReminderSent(lead.id)
    })
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  if (failed > 0) {
    results.forEach((r, i) => {
      if (r.status === 'rejected')
        console.error(`[open-house-reminders] lead ${leads[i].id} failed:`, r.reason)
    })
  }

  console.info(`[open-house-reminders] sent=${sent} failed=${failed} total=${leads.length}`)
  return NextResponse.json({ sent, failed, total: leads.length })
}
