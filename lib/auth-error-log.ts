type Entry = { ts: string; level: string; name?: string; message?: string; stack?: string; meta?: unknown }

const buf: Entry[] = []
const MAX = 50

export function recordAuthError(level: string, err: unknown, meta?: unknown) {
  const e = err as { name?: string; message?: string; stack?: string }
  buf.push({
    ts: new Date().toISOString(),
    level,
    name: e?.name,
    message: e?.message,
    stack: e?.stack?.split('\n').slice(0, 6).join('\n'),
    meta,
  })
  if (buf.length > MAX) buf.shift()
}

export function getAuthErrors(): Entry[] {
  return [...buf]
}
