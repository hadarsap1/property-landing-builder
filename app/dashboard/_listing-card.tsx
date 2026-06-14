'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Listing } from '@/lib/db/types'
import { SocialPostModal } from '@/components/social-post-modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

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

function isoToLocalInput(iso: string | Date | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function localInputToIso(value: string): string | null {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

function formatOpenHouseDate(d: Date | null): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
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
  const router = useRouter()
  const [status, setStatus] = useState<Listing['status']>(listing.status)
  const [saving, setSaving] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [socialOpen, setSocialOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<Listing['status'] | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState(false)

  // Open house state
  const [ohOpen, setOhOpen] = useState(false)
  const [ohDate, setOhDate] = useState(isoToLocalInput(listing.open_house_date))
  const [ohEnd, setOhEnd] = useState(isoToLocalInput(listing.open_house_end))
  const [ohSaving, setOhSaving] = useState(false)
  const [ohError, setOhError] = useState<string | null>(null)
  const [ohSaved, setOhSaved] = useState<Date | null>(listing.open_house_date ? new Date(listing.open_house_date) : null)

  const address = [listing.street, listing.city].filter(Boolean).join(', ')
  const publicUrl = agencySlug ? `/agency/${agencySlug}/listings/${listing.slug}` : null

  async function confirmStatusChange(next: Listing['status']) {
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

  async function confirmDelete() {
    setDeleteOpen(false)
    setSaving(true)
    const res = await fetch(`/api/listings/${listing.id}`, { method: 'DELETE' })
    if (res.ok) {
      setDeleted(true)
      router.refresh()
    } else {
      setSaving(false)
      setDeleteError(true)
    }
  }

  async function saveOpenHouse() {
    setOhSaving(true)
    setOhError(null)
    const body: Record<string, string | null> = {
      open_house_date: localInputToIso(ohDate),
      open_house_end: localInputToIso(ohEnd),
    }
    const res = await fetch(`/api/listings/${listing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setOhSaved(body.open_house_date ? new Date(body.open_house_date) : null)
      setOhOpen(false)
    } else {
      setOhError('שגיאה בשמירה — נסה שוב')
    }
    setOhSaving(false)
  }

  async function clearOpenHouse() {
    setOhSaving(true)
    setOhError(null)
    const res = await fetch(`/api/listings/${listing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ open_house_date: null, open_house_end: null }),
    })
    if (res.ok) {
      setOhDate('')
      setOhEnd('')
      setOhSaved(null)
      setOhOpen(false)
    } else {
      setOhError('שגיאה בביטול — נסה שוב')
    }
    setOhSaving(false)
  }

  if (deleted) return null

  return (
    <>
    <div className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-colors">
      {/* Main row */}
      <div className="flex items-center gap-4 p-4">
        {/* Thumbnail */}
        {listing.hero_image_url ? (
          <Image
            src={listing.hero_image_url}
            alt={listing.title ?? ''}
            width={72}
            height={72}
            className="w-[72px] h-[72px] rounded-xl object-cover shrink-0"
          />
        ) : (
          <div className="w-[72px] h-[72px] rounded-xl bg-gray-100 flex items-center justify-center text-2xl shrink-0">
            🏠
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-semibold text-gray-900 truncate text-sm">
              {listing.ai_title || listing.title || 'נכס ללא שם'}
            </span>
            <select
              value={status}
              disabled={saving}
              onChange={e => {
                const next = e.target.value as Listing['status']
                if (next !== status) setPendingStatus(next)
              }}
              className={`text-xs px-2 py-0.5 rounded-full font-medium border cursor-pointer focus:outline-none disabled:opacity-60 ${STATUS_SELECT_COLORS[status]}`}
            >
              {(Object.keys(STATUS_LABELS) as Listing['status'][]).map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            {pendingChanges > 0 && (
              <Link
                href={`/dashboard/listings/${listing.id}/review`}
                className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full px-2 py-0.5 font-medium hover:bg-yellow-100 transition-colors"
              >
                {pendingChanges} שינויים
              </Link>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">{address || '—'}</p>
          <p className="text-xs font-semibold text-gray-800 mt-0.5">
            {listing.price_on_request ? 'מחיר לפי פנייה' : formatPrice(listing.price)}
          </p>
          {/* Open house date badge */}
          {ohSaved && (
            <button
              onClick={() => setOhOpen(true)}
              className="mt-1 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5 font-medium hover:bg-orange-100 transition-colors"
            >
              🏡 בית פתוח: {formatOpenHouseDate(ohSaved)}
            </button>
          )}
        </div>

        {/* Primary CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/dashboard/listings/${listing.id}/edit`}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 font-semibold transition-colors"
          >
            עריכה
          </Link>
        </div>
      </div>

      {/* Secondary actions row */}
      <div className="flex items-center gap-1.5 px-4 pb-3 flex-wrap border-t border-gray-100 pt-3">
        {publicUrl && (
          <Link
            href={publicUrl}
            target="_blank"
            className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            צפה בדף
          </Link>
        )}
        {pendingChanges === 0 && (
          <Link
            href={`/dashboard/listings/${listing.id}/review`}
            className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            מוכר
          </Link>
        )}
        <Link
          href={`/dashboard/listings/${listing.id}/visits`}
          className="text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg px-3 py-1.5 font-medium transition-colors"
        >
          ביקורים
        </Link>
        {/* Open house button — prominent when no date is set */}
        <button
          onClick={() => setOhOpen(true)}
          className={`text-xs rounded-lg px-3 py-1.5 font-medium transition-colors ${
            ohSaved
              ? 'border border-orange-200 text-orange-700 hover:bg-orange-50'
              : 'bg-orange-50 hover:bg-orange-100 text-orange-700'
          }`}
        >
          🏡 {ohSaved ? 'ערוך בית פתוח' : 'הוסף בית פתוח'}
        </button>
        <Link
          href={`/flyer/${listing.id}`}
          target="_blank"
          className="text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg px-3 py-1.5 font-medium transition-colors"
        >
          🖨️ פלייר
        </Link>
        <button
          onClick={() => setSocialOpen(true)}
          className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg px-3 py-1.5 font-medium transition-colors"
        >
          ✨ פוסט
        </button>
        <button
          onClick={() => setDeleteOpen(true)}
          disabled={saving}
          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg px-3 py-1.5 font-medium transition-colors disabled:opacity-50 mr-auto"
        >
          מחק
        </button>
      </div>

      {statusError && (
        <p className="text-xs text-red-600 px-4 pb-3">{statusError}</p>
      )}
      {deleteError && (
        <p className="text-xs text-red-500 px-4 pb-3">שגיאה במחיקת הנכס</p>
      )}

      <SocialPostModal
        listingId={listing.id}
        listingUrl={publicUrl ? (typeof window !== 'undefined' ? `${window.location.origin}${publicUrl}` : publicUrl) : null}
        listingTitle={listing.ai_title || listing.title || 'נכס'}
        open={socialOpen}
        onClose={() => setSocialOpen(false)}
      />

      <ConfirmDialog
        open={pendingStatus !== null}
        message={`לשנות סטטוס ל"${pendingStatus ? STATUS_LABELS[pendingStatus] : ''}"?`}
        confirmLabel="שנה"
        onConfirm={() => { if (pendingStatus) void confirmStatusChange(pendingStatus) }}
        onCancel={() => setPendingStatus(null)}
      />

      <ConfirmDialog
        open={deleteOpen}
        message={`למחוק את "${listing.ai_title || listing.title || 'הנכס'}"? פעולה זו לא ניתנת לביטול.`}
        confirmLabel="מחק"
        cancelLabel="ביטול"
        danger
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>

    {/* ── Open house modal ── */}
    {ohOpen && (
      <div
        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
        onClick={e => { if (e.target === e.currentTarget) setOhOpen(false) }}
      >
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5" dir="rtl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">🏡 בית פתוח</h2>
            <button onClick={() => setOhOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>

          <p className="text-xs text-gray-500">
            {listing.ai_title || listing.title || 'נכס'} · {address || '—'}
          </p>

          {ohError && (
            <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-200">
              {ohError}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">תאריך ושעת התחלה</label>
              <input
                type="datetime-local"
                value={ohDate}
                onChange={e => setOhDate(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">שעת סיום <span className="text-gray-400 font-normal">(אופציונלי)</span></label>
              <input
                type="datetime-local"
                value={ohEnd}
                onChange={e => setOhEnd(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <p className="text-xs text-gray-400">
            באנר ספירה לאחור יופיע בדף הנכס, וכל מי שנרשם לבית הפתוח יכנס ללידים שלך אוטומטית.
          </p>

          <div className="flex gap-3 pt-1">
            {ohSaved && (
              <button
                onClick={() => void clearOpenHouse()}
                disabled={ohSaving}
                className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-2.5 transition-colors disabled:opacity-50"
              >
                בטל בית פתוח
              </button>
            )}
            <button
              onClick={() => void saveOpenHouse()}
              disabled={ohSaving || !ohDate}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              {ohSaving ? 'שומר...' : 'שמור'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
