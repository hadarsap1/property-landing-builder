import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getStripe } from '@/lib/billing/stripe'
import { PLANS, type PlanKey } from '@/lib/billing/config'
import { getSubscription } from '@/lib/billing/access'
import { validateDiscountCode, incrementDiscountUsage } from '@/lib/billing/discount-codes'
import { getAgencyById } from '@/lib/db/queries/agencies'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.agencyId || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json()) as { plan?: string; discountCode?: string }
  const planKey = body.plan as PlanKey | undefined

  if (!planKey || !(planKey in PLANS)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }
  if (!PLANS[planKey].stripePriceId) {
    return NextResponse.json({ error: 'Stripe price not configured — set STRIPE_PRICE_MONTHLY / STRIPE_PRICE_YEARLY' }, { status: 503 })
  }

  const stripe = getStripe()
  const agencyId = session.user.agencyId
  const agency = await getAgencyById(agencyId)
  if (!agency) return NextResponse.json({ error: 'Agency not found' }, { status: 404 })

  // Get or create Stripe customer
  const existing = await getSubscription(agencyId)
  let customerId = existing?.stripe_customer_id ?? null

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      name: agency.name,
      metadata: { agencyId },
    })
    customerId = customer.id
  }

  // Validate discount code and build coupon
  let discountId: string | undefined
  let discountCodeRecord = null
  if (body.discountCode?.trim()) {
    discountCodeRecord = await validateDiscountCode(body.discountCode.trim())
    if (!discountCodeRecord) {
      return NextResponse.json({ error: 'קוד הנחה לא תקף' }, { status: 422 })
    }
    const coupon = await stripe.coupons.create({
      percent_off: discountCodeRecord.discount_pct,
      duration: 'once',
      metadata: { discount_code_id: discountCodeRecord.id },
    })
    discountId = coupon.id
  }

  const rootDomain = process.env.ROOT_DOMAIN ?? 'localhost:3000'
  const protocol = rootDomain.startsWith('localhost') ? 'http' : 'https'
  const base = `${protocol}://${rootDomain}`

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: PLANS[planKey].stripePriceId, quantity: 1 }],
    ...(discountId ? { discounts: [{ coupon: discountId }] } : {}),
    success_url: `${base}/dashboard/billing?success=1`,
    cancel_url: `${base}/dashboard/billing?canceled=1`,
    metadata: {
      agencyId,
      plan: planKey,
      ...(discountCodeRecord ? { discountCodeId: discountCodeRecord.id } : {}),
    },
    subscription_data: {
      metadata: { agencyId, plan: planKey },
    },
  })

  // Increment discount usage now (Stripe won't tell us at webhook time which DB code was used)
  if (discountCodeRecord) {
    await incrementDiscountUsage(discountCodeRecord.id)
  }

  return NextResponse.json({ url: checkoutSession.url })
}
