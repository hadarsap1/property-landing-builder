'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleDelete() {
    setOpen(false)
    setBusy(true)
    const res = await fetch('/api/personal-account', { method: 'DELETE' })
    if (res.ok) {
      await signOut({ callbackUrl: '/?deleted=1' })
    } else {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={busy}
        className="text-sm text-red-500 hover:text-red-700 hover:underline disabled:opacity-50"
      >
        {busy ? 'מוחק...' : 'מחק חשבון וכל הנכסים'}
      </button>

      <ConfirmDialog
        open={open}
        message="מחיקת החשבון תמחק לצמיתות את החשבון וכל הנכסים שיצרת. פעולה זו לא ניתנת לביטול."
        confirmLabel="מחק חשבון"
        danger
        onConfirm={() => void handleDelete()}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
