'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Listing } from '@/lib/db/types'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

const STATUS_LABELS: Record<Listing['status'], string> = {
  active: 'פעיל',
  paused: 'מושהה',
  sold: 'נמכר',
}

const STATUS_SELECT_COLORS: Record<Listing['status'], string> = {
  active: 'text-green-700 bg-green-50 border-green-200',
  paused: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  sold: 'text-gray-500 bg-gray-100 border-gray-200',
}

function formatPrice(price: number | null): string {
  if (!price) return '—'
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(price)
}

export function ListingCard({
  listing,
  agencySlug,
  pendingChanges,
}: {
  listing: Listing
  agencySlug: string
  pendingChanges: number
}) {
  const [status, setStatus] = useState<Listing['status']>(listing.status)
  const [saving, setSaving] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<Listing['status'] | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  const LABELS: Record<Listing['status'], string> = { active: 'פעיל', paused: 'מושהה', sold: 'נמכר' }
  const address = [listing.street, listing.city].filter(Boolean).join(', ')
  const publicUrl = agencySlug ? `/agency/${agencySlug}/${listing.slug}` : null

  function changeStatus(next: Listing['status']) {
    if (next === status) return
    setPendingStatus(next)
  }

  async function confirmStatusChange() {
    if (!pendingStatus) return
    const next = pendingStatus
    setPendingStatus(null)
    setSaving(true)
    setStatusError(null)
    const res = await fetch(`/api/listings/${listing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (res.ok) {
      setStatus(next)
    } else {
      setStatusError('שגיאה בשמירת הסטטוס — נסה שוב')
    }
    setSaving(false)
  }

  return (
    <>
    {pendingStatus && (
      <ConfirmDialog
        message={`לשנות סטטוס ל"${LABELS[pendingStatus]}"?`}
        onConfirm={() => void confirmStatusChange()}
        onCancel={() => setPendingStatus(null)}
      />
    )}
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-2">
      {listing.hero_image_url ? (
        <img
          src={listing.hero_image_url}
          alt={listing.title ?? ''}
          className="w-16 h-16 rounded-xl object-cover shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl shrink-0">
          🏠
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 truncate">
            {listing.ai_title || listing.title || 'נכס ללא שם'}
          </span>
          <select
            value={status}
            disabled={saving}
            onChange={e => changeStatus(e.target.value as Listing['status'])}
            className={`text-xs px-2 py-0.5 rounded-full font-medium border cursor-pointer focus:outline-none disabled:opacity-60 ${STATUS_SELECT_COLORS[status]}`}
          >
            {(Object.keys(STATUS_LABELS) as Listing['status'][]).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <p className="text-sm text-gray-500 mt-0.5 truncate">{address || '—'}</p>
        <p className="text-sm font-medium text-gray-700 mt-0.5">
          {listing.price_on_request ? 'מחיר לפי פנייה' : formatPrice(listing.price)}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
        {publicUrl && (
          <Link
            href={publicUrl}
            target="_blank"
            className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            צפה
          </Link>
        )}
        <Link
          href={`/dashboard/listings/${listing.id}/review`}
          className={`text-xs rounded-lg px-3 py-1.5 font-medium transition-colors ${
            pendingChanges > 0
              ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700'
              : 'text-gray-500 hover:text-gray-800 border border-gray-200'
          }`}
        >
          {pendingChanges > 0 ? `${pendingChanges} שינויים` : 'מוכר'}
        </Link>
        <Link
          href={`/dashboard/listings/${listing.id}/edit`}
          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg px-3 py-1.5 font-medium transition-colors"
        >
          עריכה
        </Link>
      </div>
      {statusError && (
        <p className="text-xs text-red-600 pt-1">{statusError}</p>
      )}
    </div>
    </>
  )
}
