import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getVisitsByAgency } from '@/lib/db/queries/visits'
import { ensureSchema } from '@/lib/db/ensure-schema'
import { CalendarClient } from './_calendar-client'

export default async function CalendarPage() {
  const session = await auth()
  const agencyId = session?.user?.agencyId
  if (!agencyId) redirect('/auth/login?callbackUrl=/dashboard/calendar')

  await ensureSchema()
  const visits = await getVisitsByAgency(agencyId).catch(() => [])

  return <CalendarClient visits={visits} />
}
