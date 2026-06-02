'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteAgencyButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleDelete() {
    if (!confirm(`למחוק את הסוכנות "${name}"?\n\nפעולה זו תמחק גם את כל הנכסים, הסוכנים והלידים שלה. לא ניתן לבטל.`)) return
    setBusy(true)
    const res = await fetch(`/api/admin/agencies/${id}`, { method: 'DELETE' })
    if (res.ok) {
      router.refresh()
    } else {
      alert('שגיאה במחיקה')
      setBusy(false)
    }
  }

  return (
    <button
      onClick={() => void handleDelete()}
      disabled={busy}
      className="text-red-400 hover:text-red-300 text-xs disabled:opacity-50"
    >
      {busy ? '...' : 'מחק'}
    </button>
  )
}
