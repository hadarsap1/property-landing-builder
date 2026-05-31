import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getStripe } from '@/lib/billing/stripe'
import { getSubscription } from '@/lib/billing/access'

export async function POST(): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.agencyId || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sub = await getSubscription(session.user.agencyId)
  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: 'No Stripe customer yet' }, { status: 404 })
  }

  const stripe = getStripe()
  const rootDomain = process.env.ROOT_DOMAIN ?? 'localhost:3000'
  const protocol = rootDomain.startsWith('localhost') ? 'http' : 'https'

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${protocol}://${rootDomain}/dashboard/billing`,
  })

  return NextResponse.json({ url: portalSession.url })
}
