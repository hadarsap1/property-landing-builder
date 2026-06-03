import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/billing/stripe'
import { upsertSubscription } from '@/lib/billing/access'
import { incrementDiscountUsage } from '@/lib/billing/discount-codes'
import { sql } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret)
  } catch {
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 })
  }

  try {
    await handleEvent(event)
  } catch (err) {
    console.error('Webhook handler error', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// In Stripe's dahlia API, current_period_end is on each subscription item, not the subscription itself.
function getSubPeriodEnd(sub: Stripe.Subscription): Date | undefined {
  const item = sub.items?.data?.[0]
  const ts = (item as unknown as { current_period_end?: number })?.current_period_end
  return ts ? new Date(ts * 1000) : undefined
}

// In dahlia, Invoice.subscription is gone — use Invoice.parent.subscription_details.subscription
function getInvoiceSubscriptionId(inv: Stripe.Invoice): string | null {
  const parent = inv.parent as {
    type?: string
    subscription_details?: { subscription?: string | { id: string } }
  } | null
  if (parent?.type !== 'subscription_details') return null
  const sub = parent.subscription_details?.subscription
  if (!sub) return null
  return typeof sub === 'string' ? sub : sub.id
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  const stripe = getStripe()

  switch (event.type) {
    case 'checkout.session.completed': {
      const cs = event.data.object as Stripe.Checkout.Session
      if (cs.mode !== 'subscription') break
      const agencyId = cs.metadata?.agencyId
      if (!agencyId) break
      await upsertSubscription({
        agencyId,
        stripeCustomerId: cs.customer as string,
        stripeSubscriptionId: cs.subscription as string,
        plan: (cs.metadata?.plan as 'monthly' | 'yearly') ?? undefined,
        status: 'active',
        trialEndsAt: null,
      })
      // Increment discount code usage only after payment is confirmed.
      // The atomic UPDATE handles concurrent checkouts for the same code.
      if (cs.metadata?.discountCodeId) {
        await incrementDiscountUsage(cs.metadata.discountCodeId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const agencyId = sub.metadata?.agencyId
      if (!agencyId) break
      await upsertSubscription({
        agencyId,
        stripeCustomerId: sub.customer as string,
        stripeSubscriptionId: sub.id,
        plan: (sub.metadata?.plan as 'monthly' | 'yearly') ?? undefined,
        status: mapStripeStatus(sub.status),
        currentPeriodEnd: getSubPeriodEnd(sub),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const agencyId = sub.metadata?.agencyId
      if (!agencyId) break
      await upsertSubscription({
        agencyId,
        stripeCustomerId: sub.customer as string,
        stripeSubscriptionId: sub.id,
        status: 'canceled',
        cancelAtPeriodEnd: false,
      })
      // Pause all active listings for this agency
      await sql`
        UPDATE listings SET status = 'paused'
        WHERE agency_id = ${agencyId} AND status = 'active'
      `
      break
    }

    case 'invoice.payment_succeeded': {
      const inv = event.data.object as Stripe.Invoice
      const subId = getInvoiceSubscriptionId(inv)
      if (!subId) break
      const sub = await stripe.subscriptions.retrieve(subId)
      const agencyId = sub.metadata?.agencyId
      if (!agencyId) break
      await upsertSubscription({
        agencyId,
        status: 'active',
        currentPeriodEnd: getSubPeriodEnd(sub),
      })
      break
    }

    case 'invoice.payment_failed': {
      const inv = event.data.object as Stripe.Invoice
      const subId = getInvoiceSubscriptionId(inv)
      if (!subId) break
      const sub = await stripe.subscriptions.retrieve(subId)
      const agencyId = sub.metadata?.agencyId
      if (!agencyId) break
      await upsertSubscription({ agencyId, status: 'past_due' })
      break
    }
  }
}

function mapStripeStatus(
  s: Stripe.Subscription.Status
): 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' {
  switch (s) {
    case 'trialing': return 'trialing'
    case 'active':   return 'active'
    case 'past_due': return 'past_due'
    case 'canceled': return 'canceled'
    case 'unpaid':   return 'unpaid'
    default:         return 'past_due'
  }
}
