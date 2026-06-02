'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteUserButton({ id, label }: { id: string; label: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleDelete() {
    if (!confirm(`למחוק את ${label}? כל הנכסים שלו יימחקו גם.`)) return
    setBusy(true)
    const res = await fetch(`/api/admin/personal-users/${id}`, { method: 'DELETE' })
    if (res.ok) router.refresh()
    else {
      alert('שגיאה במחיקה')
      setBusy(false)
    }
  }

  return (
    <button
      onClick={() => void handleDelete()}
      disabled={busy}
      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
    >
      מחק
    </button>
  )
}
