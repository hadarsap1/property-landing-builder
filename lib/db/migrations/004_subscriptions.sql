-- Migration 004: Subscription billing for commercial agencies

CREATE TABLE IF NOT EXISTS subscriptions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id              uuid UNIQUE NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  stripe_customer_id     text UNIQUE,
  stripe_subscription_id text UNIQUE,
  plan                   text CHECK (plan IN ('monthly', 'yearly')),
  status                 text NOT NULL DEFAULT 'trialing'
                           CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  trial_ends_at          timestamp,
  current_period_end     timestamp,
  cancel_at_period_end   boolean NOT NULL DEFAULT false,
  manual_override        boolean NOT NULL DEFAULT false,
  created_at             timestamp NOT NULL DEFAULT now(),
  updated_at             timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_agency   ON subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe   ON subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Discount codes (admin-managed)
CREATE TABLE IF NOT EXISTS discount_codes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text UNIQUE NOT NULL,
  discount_pct  integer NOT NULL CHECK (discount_pct BETWEEN 1 AND 100),
  max_uses      integer,          -- NULL = unlimited
  uses_count    integer NOT NULL DEFAULT 0,
  expires_at    timestamp,        -- NULL = no expiry
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamp NOT NULL DEFAULT now()
);

-- Seed all existing agencies with a 30-day trial so no one is locked out immediately
INSERT INTO subscriptions (agency_id, status, trial_ends_at)
SELECT id, 'trialing', now() + interval '30 days'
FROM agencies
ON CONFLICT (agency_id) DO NOTHING;
