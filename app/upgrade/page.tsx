'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

export default function UpgradePage() {
  const router = useRouter()
  const [agencyName, setAgencyName] = useState('')
  const [agencySlug, setAgencySlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleNameChange(v: string) {
    setAgencyName(v)
    // Auto-derive slug
    const derived = v
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .slice(0, 50)
    setAgencySlug(derived)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!agencyName.trim() || !agencySlug.trim()) {
      setError('יש למלא שם סוכנות ושם זיהוי')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyName: agencyName.trim(), agencySlug: agencySlug.trim() }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'שגיאה — נסה שנית')
        return
      }
      // Must re-auth so JWT picks up the new commercial role
      await signOut({ redirect: false })
      router.push('/auth/login?upgraded=1')
    } catch {
      setError('שגיאת רשת — נסה שנית')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir="rtl" lang="he" className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏢</div>
          <h1 className="text-2xl font-bold text-gray-900">שדרוג לחשבון מקצועי</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            צור סוכנות, נהל צוות, קבל לידים ואנליטיקס מלא
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                שם הסוכנות <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="לדוגמה: נדל&quot;ן כהן ובניו"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                כתובת הסוכנות (URL) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-gray-50">
                <span className="text-gray-400 shrink-0 text-xs">/agency/</span>
                <input
                  type="text"
                  value={agencySlug}
                  onChange={(e) => setAgencySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-'))}
                  placeholder="cohen-realty"
                  className="flex-1 bg-transparent focus:outline-none"
                  required
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">אותיות אנגלית, מספרים ומקפים בלבד</p>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'מעבד...' : 'שדרג לחשבון מקצועי'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          לאחר השדרוג תתבקש להתחבר מחדש כדי לרענן את ההרשאות
        </p>
      </div>
    </div>
  )
}
