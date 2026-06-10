'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Listing } from '@/lib/db/types'

const STATUS_LABELS: Record<Listing['status'], string> = {
  active: 'פעיל',
  paused: 'מושהה',
  sold: 'נמכר',
}

export function ListingRowActions({ id, status: initial, title }: {
  id: string
  status: Listing['status']
  title: string
}) {
  const router = useRouter()
  const [status, setStatus] = useState<Listing['status']>(initial)
  const [busy, setBusy] = useState(false)

  async function changeStatus(next: Listing['status']) {
    if (next === status) return
    setBusy(true)
    const res = await fetch(`/api/admin/listings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (res.ok) {
      setStatus(next)
      router.refresh()
    } else {
      alert('שגיאה')
    }
    setBusy(false)
  }

  async function handleDelete() {
    if (!confirm(`למחוק את "${title}"? פעולה זו תמחק גם את כל הלידים והתמונות.`)) return
    setBusy(true)
    const res = await fetch(`/api/admin/listings/${id}`, { method: 'DELETE' })
    if (res.ok) router.refresh()
    else {
      alert('שגיאה במחיקה')
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        disabled={busy}
        onChange={(e) => void changeStatus(e.target.value as Listing['status'])}
        className="bg-gray-700 border border-gray-600 text-gray-200 text-xs rounded-md px-2 py-1 cursor-pointer focus:outline-none disabled:opacity-50"
      >
        {(Object.keys(STATUS_LABELS) as Listing['status'][]).map(s => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>
      <button
        onClick={() => void handleDelete()}
        disabled={busy}
        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
        aria-label="מחק"
      >
        מחק
      </button>
    </div>
  )
}
