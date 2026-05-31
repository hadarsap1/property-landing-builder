import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSubscription, subscriptionIsActive } from '@/lib/billing/access'

export async function GET(): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sub = await getSubscription(session.user.agencyId)
  const active = subscriptionIsActive(sub)

  return NextResponse.json({ subscription: sub, active })
}
