import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getVisitsByAgency } from '@/lib/db/queries/visits'
import { getListingsByAgency } from '@/lib/db/queries/listings'
import { ensureSchema } from '@/lib/db/ensure-schema'
import { CalendarClient } from './_calendar-client'

export default async function CalendarPage() {
  const session = await auth()
  const agencyId = session?.user?.agencyId
  if (!agencyId) redirect('/auth/login?callbackUrl=/dashboard/calendar')

  await ensureSchema()

  const [visits, listings] = await Promise.all([
    getVisitsByAgency(agencyId).catch(() => []),
    getListingsByAgency(agencyId).catch(() => []),
  ])

  return (
    <CalendarClient
      visits={visits}
      listings={listings.map(l => ({
        id: l.id,
        ai_title: l.ai_title,
        title: l.title,
        street: l.street,
        city: l.city,
      }))}
    />
  )
}
