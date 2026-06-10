'use client'

import { useSyncExternalStore } from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastEntry {
  id: number
  message: string
  type: ToastType
}

type Listener = (toasts: ToastEntry[]) => void

// Module-level store so toast() can be called from anywhere — no Provider needed.
let entries: ToastEntry[] = []
const listeners = new Set<Listener>()
let nextId = 0

function notify() {
  const snapshot = [...entries]
  listeners.forEach((fn) => fn(snapshot))
}

export function toast(message: string, type: ToastType = 'info', durationMs = 3500) {
  const id = nextId++
  entries = [...entries, { id, message, type }]
  notify()
  setTimeout(() => {
    entries = entries.filter((e) => e.id !== id)
    notify()
  }, durationMs)
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useToasts(): ToastEntry[] {
  return useSyncExternalStore(subscribe, () => entries, () => entries)
}
