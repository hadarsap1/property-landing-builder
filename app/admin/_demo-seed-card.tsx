'use client'

import { useState } from 'react'

type SeedResult = {
  ok: boolean
  reset: boolean
  credentials: { email: string; password: string }
  login_url: string
}

export function DemoSeedCard() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SeedResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<'email' | 'password' | null>(null)

  async function seed() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/seed-demo', { method: 'POST' })
      const data = await res.json() as SeedResult & { error?: string }
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'הזריעה נכשלה')
        return
      }
      setResult(data)
    } catch {
      setError('שגיאת רשת')
    } finally {
      setLoading(false)
    }
  }

  function copy(text: string, kind: 'email' | 'password') {
    void navigator.clipboard.writeText(text)
    setCopied(kind)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 p-5 lg:col-span-2">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-white">חשבון דמו לשיתוף</h2>
        <span className="text-xs text-gray-500">לשיתוף עם מעצבים / טסטרים</span>
      </div>

      {!result && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-gray-400">
            יוצר סוכנות דמו + חשבון מתווך עם סיסמה ידועה + 3 נכסים לדוגמה.
            ניתן להריץ שוב — אם החשבון קיים, הסיסמה תאופס.
          </p>
          <button
            onClick={() => void seed()}
            disabled={loading}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            {loading ? 'יוצר...' : 'צור / אפס דמו'}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-3 bg-red-900/40 border border-red-700 rounded-xl px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="bg-green-900/30 border border-green-700/50 rounded-xl px-4 py-3 text-sm text-green-300">
            {result.reset
              ? 'החשבון כבר היה קיים — הסיסמה אופסה לערך למטה'
              : 'הסוכנות והחשבון נוצרו בהצלחה'}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <CredentialRow label="מייל"  value={result.credentials.email}    onCopy={() => copy(result.credentials.email, 'email')}    copied={copied === 'email'} />
            <CredentialRow label="סיסמה" value={result.credentials.password} onCopy={() => copy(result.credentials.password, 'password')} copied={copied === 'password'} />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-xs text-gray-500">
              כניסה דרך &quot;סוכן / מתווך&quot; עם מייל וסיסמה (לא Google).
            </p>
            <a
              href={result.login_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:underline"
            >
              פתח עמוד כניסה ↗
            </a>
          </div>

          <button
            onClick={() => void seed()}
            disabled={loading}
            className="text-xs text-gray-400 hover:text-gray-200 underline"
          >
            {loading ? 'מאפס...' : 'אפס סיסמה שוב'}
          </button>
        </div>
      )}
    </div>
  )
}

function CredentialRow({
  label, value, onCopy, copied,
}: { label: string; value: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="bg-gray-900/60 border border-gray-700 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
      <div className="min-w-0 flex-1">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm text-gray-100 font-mono truncate" dir="ltr">{value}</div>
      </div>
      <button
        onClick={onCopy}
        className="shrink-0 text-xs text-blue-400 hover:text-blue-300 border border-gray-700 hover:border-blue-700 rounded-lg px-2 py-1 transition-colors"
      >
        {copied ? '✓ הועתק' : 'העתק'}
      </button>
    </div>
  )
}
