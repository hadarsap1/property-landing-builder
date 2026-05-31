export const PLAN_TRIAL_DAYS = parseInt(process.env.PLAN_TRIAL_DAYS ?? '14', 10)

export const PLANS = {
  monthly: {
    label: 'חודשי',
    period: 'לחודש',
    priceIls: parseInt(process.env.PLAN_PRICE_MONTHLY ?? '299', 10),
    stripePriceId: process.env.STRIPE_PRICE_MONTHLY ?? '',
    savingPct: 0,
  },
  yearly: {
    label: 'שנתי',
    period: 'לשנה',
    priceIls: parseInt(process.env.PLAN_PRICE_YEARLY ?? '2490', 10),
    stripePriceId: process.env.STRIPE_PRICE_YEARLY ?? '',
    savingPct: 30,
  },
} as const

export type PlanKey = keyof typeof PLANS
