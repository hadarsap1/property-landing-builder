'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { PendingChange } from '@/lib/db/types'

const CHANGE_LABELS: Record<PendingChange['change_type'], string> = {
  price: 'עדכון מחיר',
  description: 'עדכון תיאור',
  images: 'עדכון תמונות',
}

const STATUS_LABELS: Record<PendingChange['status'], string> = {
  pending: 'ממתין',
  approved: 'אושר',
  rejected: 'נדחה',
}

const STATUS_COLORS: Record<PendingChange['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
}

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>()
  const [changes, setChanges] = useState<PendingChange[]>([])
  const [loading, setLoading] = useState(true)
  const [sellerUrl, setSellerUrl] = useState<string | null>(null)
  const [sendingLink, setSendingLink] = useState(false)

  const loadChanges = useCallback(async () => {
    const res = await fetch(`/api/listings/${id}/pending-changes`)
    if (res.ok) {
      const d = (await res.json()) as { changes: PendingChange[] }
      setChanges(d.changes)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { void loadChanges() }, [loadChanges])

  async function generateSellerLink() {
    setSendingLink(true)
    const res = await fetch(`/api/listings/${id}/seller-token`, { method: 'POST' })
    if (res.ok) {
      const d = (await res.json()) as { sellerUrl: string }
      setSellerUrl(d.sellerUrl)
    }
    setSendingLink(false)
  }

  async function review(changeId: string, status: 'approved' | 'rejected', note?: string) {
    const res = await fetch(`/api/pending-changes/${changeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, agent_note: note }),
    })
    if (res.ok) {
      setChanges(prev =>
        prev.map(c => c.id === changeId ? { ...c, status, agent_note: note ?? null, reviewed_at: new Date() } : c)
      )
    }
  }

  const pending = changes.filter(c => c.status === 'pending')
  const reviewed = changes.filter(c => c.status !== 'pending')

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">← נכסים</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1">שינויים מהמוכר</h1>
        </div>
        <button
          onClick={() => void generateSellerLink()}
          disabled={sendingLink}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          {sendingLink ? 'יוצר...' : '+ שלח קישור למוכר'}
        </button>
      </div>

      {sellerUrl && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm space-y-2">
          <p className="font-medium text-green-800">קישור למוכר נוצר (תקף 7 ימים)</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border border-green-200 rounded-lg px-3 py-1.5 text-green-700 text-xs truncate" dir="ltr">
              {sellerUrl}
            </code>
            <button
              onClick={() => void navigator.clipboard.writeText(sellerUrl)}
              className="shrink-0 text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              העתק
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">טוען...</p>
      ) : changes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-3xl mb-3">📬</div>
          <p className="text-sm">אין שינויים ממתינים. שלח קישור למוכר כדי לאפשר לו להציע עדכונים.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">ממתינים לאישור ({pending.length})</h2>
              {pending.map(c => <ChangeCard key={c.id} change={c} onReview={review} />)}
            </section>
          )}
          {reviewed.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">היסטוריה</h2>
              {reviewed.map(c => <ChangeCard key={c.id} change={c} onReview={review} />)}
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function ChangeCard({
  change,
  onReview,
}: {
  change: PendingChange
  onReview: (id: string, status: 'approved' | 'rejected', note?: string) => void
}) {
  const [rejectNote, setRejectNote] = useState('')
  const [showReject, setShowReject] = useState(false)
  const isPending = change.status === 'pending'
  const data = change.change_data as Record<string, unknown>

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 text-sm">{CHANGE_LABELS[change.change_type]}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[change.status]}`}>
            {STATUS_LABELS[change.status]}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(change.created_at).toLocaleDateString('he-IL')}
        </span>
      </div>

      {/* Change preview */}
      <ChangePreview type={change.change_type} data={data} />

      {change.agent_note && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          הערה: {change.agent_note}
        </p>
      )}

      {isPending && (
        <div className="space-y-2 pt-1">
          {showReject ? (
            <div className="space-y-2">
              <input
                type="text"
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                placeholder="הערה למוכר (אופציונלי)"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { onReview(change.id, 'rejected', rejectNote || undefined); setShowReject(false) }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 rounded-xl transition-colors"
                >
                  דחה
                </button>
                <button
                  onClick={() => setShowReject(false)}
                  className="flex-1 border border-gray-300 text-gray-700 text-sm py-2 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  ביטול
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => onReview(change.id, 'approved')}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
              >
                אשר
              </button>
              <button
                onClick={() => setShowReject(true)}
                className="flex-1 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium py-2 rounded-xl transition-colors"
              >
                דחה
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ChangePreview({
  type,
  data,
}: {
  type: PendingChange['change_type']
  data: Record<string, unknown>
}) {
  if (type === 'price') {
    return (
      <p className="text-sm text-gray-700">
        {data.price_on_request
          ? 'מחיר לפי פנייה'
          : `₪${(data.price as number)?.toLocaleString('he-IL') ?? '—'}`}
      </p>
    )
  }

  if (type === 'description') {
    return (
      <p className="text-sm text-gray-700 line-clamp-3 bg-gray-50 rounded-lg px-3 py-2">
        {data.description as string}
      </p>
    )
  }

  if (type === 'images') {
    const urls = data.image_urls as string[] | undefined
    return (
      <div className="flex gap-2 overflow-x-auto">
        {urls?.slice(0, 5).map((url) => (
          <img key={url} src={url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
        ))}
        {(urls?.length ?? 0) > 5 && (
          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500 shrink-0">
            +{(urls?.length ?? 0) - 5}
          </div>
        )}
      </div>
    )
  }

  return null
}
