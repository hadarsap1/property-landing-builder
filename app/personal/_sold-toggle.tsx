'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Listing } from '@/lib/db/types'

/**
 * Lets an owner mark a published listing as "sold" (and revert it back).
 * A sold listing stays live so shared links keep resolving, but its page
 * shows a prominent "sold" state with contact & sharing disabled.
 *
 * Only rendered for active/sold listings — a paused listing is already
 * hidden, so marking it sold there would be meaningless.
 */
export function SoldToggle({ id, status: initial }: {
  id: string
  status: Listing['status']
}) {
  const router = useRouter()
  const [status, setStatus] = useState<Listing['status']>(initial)
  const [busy, setBusy] = useState(false)

  if (status !== 'active' && status !== 'sold') return null

  const sold = status === 'sold'

  async function changeStatus(next: Listing['status']) {
    setBusy(true)
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (res.ok) {
        setStatus(next)
        router.refresh()
      } else {
        alert('אירעה שגיאה, נסו שוב')
      }
    } catch {
      alert('אירעה שגיאה, נסו שוב')
    } finally {
      setBusy(false)
    }
  }

  function handleMarkSold() {
    if (!confirm('לסמן את הנכס כ"נמכר"? הדף יישאר פעיל אך יוצגו עליו סימוני "נמכר", וכפתורי יצירת הקשר והשיתוף יכובו. תמיד אפשר להחזיר למכירה.')) return
    void changeStatus('sold')
  }

  if (sold) {
    return (
      <button
        onClick={() => void changeStatus('active')}
        disabled={busy}
        className="text-xs rounded-lg px-2.5 py-1 font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50"
      >
        {busy ? '...' : 'החזר למכירה'}
      </button>
    )
  }

  return (
    <button
      onClick={handleMarkSold}
      disabled={busy}
      className="text-xs rounded-lg px-2.5 py-1 font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-700 transition-colors disabled:opacity-50"
    >
      {busy ? '...' : 'סמן כנמכר'}
    </button>
  )
}
