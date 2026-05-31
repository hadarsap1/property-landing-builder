'use client'

import { useState, useEffect } from 'react'
import type { Subscription } from '@/lib/db/types'
import { PLANS } from '@/lib/billing/config'

interface SubState {
  subscription: Subscription | null
  active: boolean
}

const STATUS_LABELS: Record<string, { text: string; cls: string }> = {
  trialing: { text: 'תקופת ניסיון', cls: 'bg-blue-100 text-blue-700' },
  active:   { text: 'פעיל',         cls: 'bg-green-100 text-green-700' },
  past_due: { text: 'תשלום נכשל',   cls: 'bg-red-100 text-red-600' },
  canceled: { text: 'בוטל',         cls: 'bg-gray-100 text-gray-500' },
  unpaid:   { text: 'לא שולם',      cls: 'bg-red-100 text-red-600' },
}

export default function BillingPage() {
  const [state, setState] = useState<SubState | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly')
  const [discountCode, setDiscountCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void fetch('/api/billing/subscription')
      .then(r => r.json())
      .then((d: SubState) => setState(d))
  }, [])

  async function handleSubscribe() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, discountCode: discountCode.trim() || undefined }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setError(data.error ?? 'שגיאה — נסה שנית')
        return
      }
      window.location.href = data.url
    } catch {
      setError('שגיאת רשת — נסה שנית')
    } finally {
      setLoading(false)
    }
  }

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = (await res.json()) as { url?: string }
      if (data.url) window.location.href = data.url
    } catch { /* ignore */ }
    setPortalLoading(false)
  }

  const sub = state?.subscription
  const status = sub?.status ?? 'canceled'
  const badge = STATUS_LABELS[status] ?? STATUS_LABELS.canceled

  const trialDaysLeft = sub?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / 86_400_000))
    : null

  const hasActiveStripe = sub?.stripe_subscription_id && (status === 'active' || status === 'past_due')

  return (
    <div dir="rtl" className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-gray-900">חיוב ומנוי</h1>

      {/* Current status */}
      {state && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800">סטטוס נוכחי</span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.cls}`}>
              {badge.text}
            </span>
          </div>

          {status === 'trialing' && trialDaysLeft !== null && (
            <p className="text-sm text-blue-700 bg-blue-50 rounded-xl px-4 py-3">
              {trialDaysLeft > 0
                ? `נותרו ${trialDaysLeft} ימים בתקופת הניסיון. לאחר מכן יידרש מנוי.`
                : 'תקופת הניסיון הסתיימה. רכוש מנוי כדי להמשיך.'}
            </p>
          )}

          {status === 'past_due' && (
            <p className="text-sm text-red-700 bg-red-50 rounded-xl px-4 py-3">
              התשלום האחרון נכשל. עדכן אמצעי תשלום כדי לשמור על הגישה.
            </p>
          )}

          {status === 'canceled' && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">
              המנוי בוטל. רכוש מנוי חדש כדי לחדש גישה.
            </p>
          )}

          {sub?.plan && (
            <div className="text-sm text-gray-600 flex gap-4">
              <span>תוכנית: <strong>{sub.plan === 'monthly' ? 'חודשי' : 'שנתי'}</strong></span>
              {sub.current_period_end && (
                <span>
                  חידוש: <strong>{new Date(sub.current_period_end).toLocaleDateString('he-IL')}</strong>
                </span>
              )}
              {sub.cancel_at_period_end && (
                <span className="text-orange-600">יבוטל בתאריך הסיום</span>
              )}
            </div>
          )}

          {hasActiveStripe && (
            <button
              onClick={() => void handlePortal()}
              disabled={portalLoading}
              className="text-sm text-blue-600 hover:underline disabled:opacity-50"
            >
              {portalLoading ? 'פותח...' : 'נהל מנוי / עדכן תשלום ↗'}
            </button>
          )}
        </div>
      )}

      {/* Plan selector — shown when not active */}
      {(!state?.active || status === 'trialing') && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
          <h2 className="font-semibold text-gray-800">
            {status === 'trialing' ? 'בחר תוכנית לאחר הניסיון' : 'רכוש מנוי'}
          </h2>

          {/* Plan toggle */}
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(PLANS) as [string, typeof PLANS[keyof typeof PLANS]][]).map(([key, plan]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedPlan(key as 'monthly' | 'yearly')}
                className={`rounded-2xl border-2 p-4 text-right transition-all ${
                  selectedPlan === key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900">{plan.label}</div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  ₪{plan.priceIls.toLocaleString('he-IL')}
                  <span className="text-sm font-normal text-gray-500"> {plan.period}</span>
                </div>
                {plan.savingPct > 0 && (
                  <div className="text-xs font-semibold text-green-600 mt-1 bg-green-50 inline-block px-2 py-0.5 rounded-full">
                    חסכון {plan.savingPct}%
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Discount code */}
          <div className="flex gap-2">
            <input
              type="text"
              value={discountCode}
              onChange={e => setDiscountCode(e.target.value.toUpperCase())}
              placeholder="קוד הנחה (אופציונלי)"
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              dir="ltr"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            onClick={() => void handleSubscribe()}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            {loading ? 'מעבד...' : `עבור לתשלום — ${PLANS[selectedPlan].label}`}
          </button>

          <p className="text-xs text-center text-gray-400">
            תשלום מאובטח דרך Stripe · ביטול בכל עת
          </p>
        </div>
      )}

      {/* Feature list */}
      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-700 mb-3 text-sm">המנוי כולל:</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          {[
            'נכסים ללא הגבלה',
            'מיתוג הסוכנות על כל דפי הנחיתה',
            'ניהול צוות סוכנים',
            'מעקב לידים ויצירת קשר',
            'אנליטיקס ודוחות',
            'קישור מוכר + סל שינויים ממתינים',
          ].map(f => (
            <li key={f} className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
