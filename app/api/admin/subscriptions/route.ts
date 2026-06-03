import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAllSubscriptions } from '@/lib/billing/access'
import { getDemoAgencyId } from '@/lib/db/queries/demo'

export async function GET(): Promise<NextResponse> {
  const session = await auth()
  if (!process.env.SUPER_ADMIN_EMAIL || session?.user?.email !== process.env.SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [allSubs, demoAgencyId] = await Promise.all([getAllSubscriptions(), getDemoAgencyId()])
  const subscriptions = allSubs.filter(s => s.agency_id !== demoAgencyId)
  return NextResponse.json({ subscriptions })
}
