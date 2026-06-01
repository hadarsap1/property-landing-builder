type CauseEntry = { name?: string; message?: string; stack?: string }

type Entry = {
  ts: string
  level: string
  name?: string
  message?: string
  stack?: string
  cause?: CauseEntry
  meta?: unknown
}

const buf: Entry[] = []
const MAX = 50

function extractCause(err: unknown): CauseEntry | undefined {
  const c = (err as { cause?: unknown })?.cause
  if (!c) return undefined
  const ce = c as { name?: string; message?: string; stack?: string }
  return {
    name: ce.name,
    message: ce.message,
    stack: ce.stack?.split('\n').slice(0, 10).join('\n'),
  }
}

export function recordAuthError(level: string, err: unknown, meta?: unknown) {
  const e = err as { name?: string; message?: string; stack?: string }
  buf.push({
    ts: new Date().toISOString(),
    level,
    name: e?.name,
    message: e?.message,
    stack: e?.stack?.split('\n').slice(0, 6).join('\n'),
    cause: extractCause(err),
    meta,
  })
  if (buf.length > MAX) buf.shift()
}

export function getAuthErrors(): Entry[] {
  return [...buf]
}
