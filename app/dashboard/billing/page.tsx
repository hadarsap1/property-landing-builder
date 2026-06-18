'use client'

import { useState, useEffect } from 'react'
import type { Subscription } from '@/lib/db/types'
import { PLANS } from '@/lib/billing/config'

interface SubState {
  subscription: Subscription | null
  active: boolean
}

const STATUS_LABELS: Record<string, { text: string; style: React.CSSProperties }> = {
  trialing: { text: 'תקופת ניסיון', style: { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' } },
  active:   { text: 'פעיל',         style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' } },
  past_due: { text: 'תשלום נכשל',   style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
  canceled: { text: 'בוטל',         style: { background: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb' } },
  unpaid:   { text: 'לא שולם',      style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
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
      <h1 className="text-xl font-bold" style={{ color: '#111' }}>חיוב ומנוי</h1>

      {/* Current status */}
      {state && (
        <div className="p-5 space-y-3" style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px' }}>
          <div className="flex items-center justify-between">
            <span className="font-semibold" style={{ color: '#111' }}>סטטוס נוכחי</span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={badge.style}>
              {badge.text}
            </span>
          </div>

          {status === 'trialing' && trialDaysLeft !== null && (
            <p className="text-sm rounded-xl px-4 py-3" style={{ color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              {trialDaysLeft > 0
                ? `נותרו ${trialDaysLeft} ימים בתקופת הניסיון. לאחר מכן יידרש מנוי.`
                : 'תקופת הניסיון הסתיימה. רכוש מנוי כדי להמשיך.'}
            </p>
          )}

          {status === 'past_due' && (
            <p className="text-sm rounded-xl px-4 py-3" style={{ color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca' }}>
              התשלום האחרון נכשל. עדכן אמצעי תשלום כדי לשמור על הגישה.
            </p>
          )}

          {status === 'canceled' && (
            <p className="text-sm rounded-xl px-4 py-3" style={{ color: '#888', background: '#f7f5f2', border: '1px solid #e5e5e5' }}>
              המנוי בוטל. רכוש מנוי חדש כדי לחדש גישה.
            </p>
          )}

          {sub?.plan && (
            <div className="text-sm flex gap-4" style={{ color: '#888' }}>
              <span>תוכנית: <strong style={{ color: '#111' }}>{sub.plan === 'monthly' ? 'חודשי' : 'שנתי'}</strong></span>
              {sub.current_period_end && (
                <span>
                  חידוש: <strong style={{ color: '#111' }}>{new Date(sub.current_period_end).toLocaleDateString('he-IL')}</strong>
                </span>
              )}
              {sub.cancel_at_period_end && (
                <span style={{ color: '#c0392b' }}>יבוטל בתאריך הסיום</span>
              )}
            </div>
          )}

          {hasActiveStripe && (
            <button
              onClick={() => void handlePortal()}
              disabled={portalLoading}
              className="text-sm hover:underline disabled:opacity-50"
              style={{ color: '#c0392b' }}
            >
              {portalLoading ? 'פותח...' : 'נהל מנוי / עדכן תשלום ↗'}
            </button>
          )}
        </div>
      )}

      {/* Plan selector — shown when not active */}
      {(!state?.active || status === 'trialing') && (
        <div className="p-5 space-y-5" style={{ background: '#fff', border: '2px solid #111', borderRadius: '8px' }}>
          <h2 className="font-semibold" style={{ color: '#111' }}>
            {status === 'trialing' ? 'בחר תוכנית לאחר הניסיון' : 'רכוש מנוי'}
          </h2>

          {/* Plan toggle */}
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(PLANS) as [string, typeof PLANS[keyof typeof PLANS]][]).map(([key, plan]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedPlan(key as 'monthly' | 'yearly')}
                className="rounded-2xl p-4 text-right transition-all"
                style={selectedPlan === key
                  ? { border: '2px solid #111', background: '#f7f5f2' }
                  : { border: '2px solid #e5e5e5', background: '#fff' }}
              >
                <div className="font-semibold" style={{ color: '#111' }}>{plan.label}</div>
                <div className="text-xl font-bold mt-1" style={{ color: '#111' }}>
                  ₪{plan.priceIls.toLocaleString('he-IL')}
                  <span className="text-sm font-normal" style={{ color: '#888' }}> {plan.period}</span>
                </div>
                {plan.savingPct > 0 && (
                  <div className="text-xs font-semibold mt-1 inline-block px-2 py-0.5 rounded-full" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
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
              className="flex-1 px-4 py-2.5 text-sm focus:outline-none"
              style={{ border: '2px solid #111', background: '#f7f5f2', borderRadius: '8px' }}
              dir="ltr"
            />
          </div>

          {error && (
            <p className="text-sm rounded-xl px-4 py-3" style={{ color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca' }}>{error}</p>
          )}

          <button
            onClick={() => void handleSubscribe()}
            disabled={loading}
            className="w-full font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50"
            style={{ background: '#c0392b', color: '#fff' }}
          >
            {loading ? 'מעבד...' : `עבור לתשלום — ${PLANS[selectedPlan].label}`}
          </button>

          <p className="text-xs text-center" style={{ color: '#aaa' }}>
            תשלום מאובטח דרך Stripe · ביטול בכל עת
          </p>
        </div>
      )}

      {/* Feature list */}
      <div className="p-5" style={{ background: '#f7f5f2', border: '2px solid #111', borderRadius: '8px' }}>
        <h3 className="font-semibold mb-3 text-sm" style={{ color: '#111' }}>המנוי כולל:</h3>
        <ul className="space-y-2 text-sm" style={{ color: '#888' }}>
          {[
            'נכסים ללא הגבלה',
            'מיתוג הסוכנות על כל דפי הנחיתה',
            'ניהול צוות סוכנים',
            'מעקב לידים ויצירת קשר',
            'תובנות חכמות ודוחות ביצועים',
            'קישור מוכר + סל שינויים ממתינים',
          ].map(f => (
            <li key={f} className="flex items-center gap-2">
              <span style={{ color: '#166534' }}>✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
