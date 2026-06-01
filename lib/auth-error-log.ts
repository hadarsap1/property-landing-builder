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
  // AuthError wraps the original error as cause.err (not cause directly)
  const cause = (err as { cause?: unknown })?.cause
  if (!cause) return undefined
  const causeObj = cause as { err?: unknown; name?: string; message?: string; stack?: string }
  // The real error lives in cause.err when AuthError wraps it
  const real = (causeObj.err ?? cause) as { name?: string; message?: string; stack?: string }
  return {
    name: real.name ?? causeObj.name,
    message: real.message ?? causeObj.message,
    stack: (real.stack ?? causeObj.stack)?.split('\n').slice(0, 10).join('\n'),
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
