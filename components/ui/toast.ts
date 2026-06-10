'use client'

import { useState, useEffect } from 'react'

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

export function useToasts(): ToastEntry[] {
  const [state, setState] = useState<ToastEntry[]>(entries)
  useEffect(() => {
    listeners.add(setState)
    setState([...entries])
    return () => {
      listeners.delete(setState)
    }
  }, [])
  return state
}
