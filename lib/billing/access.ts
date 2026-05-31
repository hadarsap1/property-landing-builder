import { sql } from '@/lib/db'
import type { Subscription } from '@/lib/db/types'

export async function getSubscription(agencyId: string): Promise<Subscription | null> {
  const { rows } = await sql<Subscription>`
    SELECT * FROM subscriptions WHERE agency_id = ${agencyId} LIMIT 1
  `
  return rows[0] ?? null
}

export function subscriptionIsActive(sub: Subscription | null): boolean {
  if (!sub) return false
  if (sub.manual_override) return true
  if (sub.status === 'active') return true
  if (
    sub.status === 'trialing' &&
    sub.trial_ends_at &&
    new Date(sub.trial_ends_at) > new Date()
  ) return true
  return false
}

export async function isAgencyActive(agencyId: string): Promise<boolean> {
  const sub = await getSubscription(agencyId)
  return subscriptionIsActive(sub)
}

export async function upsertSubscription(data: {
  agencyId: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  plan?: 'monthly' | 'yearly'
  status: Subscription['status']
  currentPeriodEnd?: Date | null
  cancelAtPeriodEnd?: boolean
  trialEndsAt?: Date | null
}): Promise<Subscription> {
  const { rows } = await sql<Subscription>`
    INSERT INTO subscriptions (
      agency_id, stripe_customer_id, stripe_subscription_id,
      plan, status, current_period_end, cancel_at_period_end, trial_ends_at, updated_at
    )
    VALUES (
      ${data.agencyId},
      ${data.stripeCustomerId ?? null},
      ${data.stripeSubscriptionId ?? null},
      ${data.plan ?? null},
      ${data.status},
      ${data.currentPeriodEnd?.toISOString() ?? null},
      ${data.cancelAtPeriodEnd ?? false},
      ${data.trialEndsAt?.toISOString() ?? null},
      now()
    )
    ON CONFLICT (agency_id) DO UPDATE SET
      stripe_customer_id     = COALESCE(EXCLUDED.stripe_customer_id,     subscriptions.stripe_customer_id),
      stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, subscriptions.stripe_subscription_id),
      plan                   = COALESCE(EXCLUDED.plan,                   subscriptions.plan),
      status                 = EXCLUDED.status,
      current_period_end     = COALESCE(EXCLUDED.current_period_end,     subscriptions.current_period_end),
      cancel_at_period_end   = EXCLUDED.cancel_at_period_end,
      trial_ends_at          = COALESCE(EXCLUDED.trial_ends_at,          subscriptions.trial_ends_at),
      updated_at             = now()
    RETURNING *
  `
  return rows[0]
}

export async function setManualOverride(
  agencyId: string,
  override: boolean
): Promise<Subscription | null> {
  const { rows } = await sql<Subscription>`
    UPDATE subscriptions
    SET manual_override = ${override}, updated_at = now()
    WHERE agency_id = ${agencyId}
    RETURNING *
  `
  return rows[0] ?? null
}

export async function getAllSubscriptions(): Promise<
  (Subscription & { agency_name: string; agency_slug: string })[]
> {
  const { rows } = await sql<Subscription & { agency_name: string; agency_slug: string }>`
    SELECT s.*, a.name AS agency_name, a.slug AS agency_slug
    FROM subscriptions s
    JOIN agencies a ON a.id = s.agency_id
    ORDER BY s.created_at DESC
  `
  return rows
}
