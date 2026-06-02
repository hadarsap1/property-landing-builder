'use client'

import { useState } from 'react'

type Platform = 'facebook' | 'instagram'
type Tone = 'casual' | 'professional' | 'urgent'

interface SocialPostResponse {
  body: string
  hashtags: string[]
  cta: string
  platform: Platform
  tone: Tone
  error?: string
}

const TONE_LABELS: Record<Tone, string> = {
  casual: 'חברי',
  professional: 'מקצועי',
  urgent: 'דחוף',
}

const PLATFORMS: { id: Platform; label: string; icon: string; brand: string }[] = [
  { id: 'facebook',  label: 'Facebook',  icon: 'f', brand: 'bg-[#1877F2] text-white' },
  { id: 'instagram', label: 'Instagram', icon: '📷', brand: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white' },
]

export function SocialPostModal({
  listingId,
  listingUrl,
  listingTitle,
  open,
  onClose,
}: {
  listingId: string
  listingUrl: string | null
  listingTitle: string
  open: boolean
  onClose: () => void
}) {
  const [platform, setPlatform] = useState<Platform>('facebook')
  const [tone, setTone] = useState<Tone>('casual')
  const [post, setPost] = useState<SocialPostResponse | null>(null)
  const [editedBody, setEditedBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/listings/${listingId}/social-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, tone }),
      })
      const data = (await res.json()) as SocialPostResponse
      if (!res.ok || data.error) {
        setError(data.error ?? 'יצירת הפוסט נכשלה')
        return
      }
      setPost(data)
      setEditedBody(data.body)
    } catch {
      setError('שגיאת רשת — נסה שוב')
    } finally {
      setLoading(false)
    }
  }

  function fullText(): string {
    if (!post) return ''
    const parts = [editedBody.trim()]
    if (post.cta && !editedBody.includes(post.cta)) parts.push('', post.cta)
    if (listingUrl) parts.push('', listingUrl)
    if (post.hashtags.length) parts.push('', post.hashtags.join(' '))
    return parts.join('\n')
  }

  async function copyAll() {
    await navigator.clipboard.writeText(fullText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function reset() {
    setPost(null)
    setEditedBody('')
    setError(null)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start sm:items-center justify-center px-4 py-8 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl space-y-4 p-6" dir="rtl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">צור פוסט לרשתות חברתיות</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{listingTitle}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="סגור"
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none shrink-0"
          >
            ×
          </button>
        </div>

        {/* Platform tabs */}
        <div className="flex gap-2">
          {PLATFORMS.map(p => (
            <button
              key={p.id}
              onClick={() => { setPlatform(p.id); reset() }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                platform === p.id
                  ? p.brand + ' shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="text-base">{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>

        {/* Tone chips */}
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">טון</p>
          <div className="flex gap-1.5">
            {(Object.keys(TONE_LABELS) as Tone[]).map(t => (
              <button
                key={t}
                onClick={() => { setTone(t); reset() }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  tone === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {TONE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Generate / regenerate */}
        {!post && (
          <button
            onClick={() => void generate()}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                כותב פוסט...
              </>
            ) : (
              <>✨ צור פוסט עם AI</>
            )}
          </button>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-xl px-3 py-2 border border-red-200">
            {error}
          </div>
        )}

        {post && (
          <div className="space-y-3">
            {/* Editable body */}
            <div>
              <label htmlFor="post-body" className="text-xs font-medium text-gray-600 mb-1.5 block">
                טקסט הפוסט (ניתן לעריכה)
              </label>
              <textarea
                id="post-body"
                value={editedBody}
                onChange={e => setEditedBody(e.target.value)}
                rows={8}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>

            {/* CTA */}
            {post.cta && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">קריאה לפעולה</p>
                <div className="bg-blue-50 text-blue-900 text-sm rounded-xl px-3 py-2 border border-blue-100">
                  {post.cta}
                </div>
              </div>
            )}

            {/* Hashtags */}
            {post.hashtags.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1.5">תגיות (Hashtags)</p>
                <div className="flex flex-wrap gap-1.5">
                  {post.hashtags.map((h, i) => (
                    <span
                      key={`${h}-${i}`}
                      className="text-xs bg-gray-100 text-gray-700 rounded-full px-2.5 py-1 border border-gray-200"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Link preview */}
            {listingUrl && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs">
                <span className="text-gray-500">קישור שיתבצע: </span>
                <span className="text-blue-600 font-mono" dir="ltr">{listingUrl}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => void generate()}
                disabled={loading}
                className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                {loading ? 'מחדש...' : 'יצירה מחדש'}
              </button>
              <button
                onClick={() => void copyAll()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                {copied ? '✓ הועתק!' : '📋 העתק הכל'}
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center pt-1">
              העתק והדבק בפייסבוק / אינסטגרם. בקרוב — פרסום ישיר מהמערכת.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
