'use client'

import { useState } from 'react'
import type { Listing } from '@/lib/db/types'

type Tab = 'price' | 'description' | 'images'

const TAB_LABELS: Record<Tab, string> = {
  price: 'מחיר',
  description: 'תיאור',
  images: 'תמונות',
}

export default function SellerForm({ token, listing }: { token: string; listing: Listing }) {
  const [tab, setTab] = useState<Tab>('price')
  const [submitted, setSubmitted] = useState<Tab | null>(null)

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        ניתן להציע עדכונים לנכס. הנציג יבדוק ויאשר את השינויים לפני פרסומם.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {submitted === tab ? (
        <SuccessBanner onReset={() => setSubmitted(null)} />
      ) : (
        <>
          {tab === 'price' && (
            <PricePanel token={token} listing={listing} onSubmitted={() => setSubmitted('price')} />
          )}
          {tab === 'description' && (
            <DescriptionPanel token={token} listing={listing} onSubmitted={() => setSubmitted('description')} />
          )}
          {tab === 'images' && (
            <ImagesPanel token={token} listing={listing} onSubmitted={() => setSubmitted('images')} />
          )}
        </>
      )}
    </div>
  )
}

function SuccessBanner({ onReset }: { onReset: () => void }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-3">
      <div className="text-3xl">✅</div>
      <p className="font-semibold text-green-800">ההצעה נשלחה לנציג לאישור</p>
      <p className="text-sm text-green-700">השינויים יופיעו באתר לאחר אישור הנציג.</p>
      <button
        onClick={onReset}
        className="text-sm text-green-700 hover:text-green-900 underline"
      >
        שלח עדכון נוסף
      </button>
    </div>
  )
}

async function submitChange(
  token: string,
  change_type: string,
  change_data: Record<string, unknown>
): Promise<boolean> {
  const res = await fetch(`/api/seller/${token}/changes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ change_type, change_data }),
  })
  return res.ok
}

/* ── Price Panel ─────────────────────────────────────────── */
function PricePanel({
  token,
  listing,
  onSubmitted,
}: {
  token: string
  listing: Listing
  onSubmitted: () => void
}) {
  const [priceOnRequest, setPriceOnRequest] = useState(listing.price_on_request)
  const [price, setPrice] = useState(listing.price?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    const ok = await submitChange(token, 'price', {
      price: priceOnRequest ? null : parseInt(price.replace(/\D/g, ''), 10) || null,
      price_on_request: priceOnRequest,
    })
    if (ok) onSubmitted()
    else setError('שגיאה בשליחה, נסה שוב')
    setSaving(false)
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={priceOnRequest}
          onChange={e => setPriceOnRequest(e.target.checked)}
          className="w-4 h-4 rounded"
        />
        <span className="text-sm font-medium text-gray-700">מחיר לפי פנייה</span>
      </label>

      {!priceOnRequest && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">מחיר (₪)</label>
          <input
            type="text"
            inputMode="numeric"
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="לדוגמה: 2500000"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir="ltr"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
      >
        {saving ? 'שולח...' : 'הצע עדכון מחיר'}
      </button>
    </form>
  )
}

/* ── Description Panel ───────────────────────────────────── */
function DescriptionPanel({
  token,
  listing,
  onSubmitted,
}: {
  token: string
  listing: Listing
  onSubmitted: () => void
}) {
  const [description, setDescription] = useState(listing.raw_description ?? listing.ai_story ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) return
    setSaving(true); setError(null)
    const ok = await submitChange(token, 'description', { description: description.trim() })
    if (ok) onSubmitted()
    else setError('שגיאה בשליחה, נסה שוב')
    setSaving(false)
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">תיאור הנכס</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={6}
          required
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          placeholder="תאר את הנכס בצורה חופשית..."
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
      >
        {saving ? 'שולח...' : 'הצע עדכון תיאור'}
      </button>
    </form>
  )
}

/* ── Images Panel ────────────────────────────────────────── */
function ImagesPanel({
  token,
  listing,
  onSubmitted,
}: {
  token: string
  listing: Listing
  onSubmitted: () => void
}) {
  const [images, setImages] = useState<string[]>(listing.image_urls ?? [])
  const [heroUrl, setHeroUrl] = useState(listing.hero_image_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function uploadFile(file: File): Promise<string | null> {
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch(`/api/blob/upload-public?token=${token}`, { method: 'POST', body: fd })
    if (!res.ok) return null
    const { url } = (await res.json()) as { url: string }
    return url
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true); setError(null)
    const urls: string[] = []
    for (const file of files) {
      const url = await uploadFile(file)
      if (url) urls.push(url)
    }
    setImages(prev => [...prev, ...urls])
    setUploading(false)
    e.target.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!images.length) { setError('יש להוסיף לפחות תמונה אחת'); return }
    setSaving(true); setError(null)
    const ok = await submitChange(token, 'images', {
      image_urls: images,
      hero_image_url: heroUrl || images[0] || null,
    })
    if (ok) onSubmitted()
    else setError('שגיאה בשליחה, נסה שוב')
    setSaving(false)
  }

  function removeImage(url: string) {
    setImages(prev => prev.filter(u => u !== url))
    if (heroUrl === url) setHeroUrl(images.find(u => u !== url) ?? '')
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      {/* Existing images grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url) => (
            <div key={url} className="relative group aspect-square">
              <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity flex flex-col items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => setHeroUrl(url)}
                  className={`text-xs px-2 py-1 rounded ${heroUrl === url ? 'bg-blue-500 text-white' : 'bg-white/80 text-gray-800'}`}
                >
                  {heroUrl === url ? '★ ראשית' : 'הגדר ראשית'}
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="text-xs bg-red-500 text-white px-2 py-1 rounded"
                >
                  הסר
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-6 cursor-pointer hover:border-blue-400 transition-colors">
        <span className="text-sm text-gray-600">{uploading ? 'מעלה...' : '+ הוסף תמונות'}</span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void handleFilesSelected(e)}
          disabled={uploading}
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving || uploading || !images.length}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
      >
        {saving ? 'שולח...' : 'הצע עדכון תמונות'}
      </button>
    </form>
  )
}
