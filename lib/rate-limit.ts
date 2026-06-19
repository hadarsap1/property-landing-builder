/**
 * Shared rate limiting utility.
 *
 * KV-based (primary): uses @vercel/kv when KV_URL is configured.
 * In-memory fallback: used for auth routes where a per-process guard is
 *   acceptable.  Resets on cold start — intentional for low-stakes limits.
 *
 * AI-cost routes MUST use kvRateLimit, which FAILS CLOSED when KV is absent
 * (returns true = "is rate limited") so no unbounded Anthropic charges occur.
 */

// ── In-memory fallback (auth routes only) ────────────────────────────────────

const _mem = new Map<string, { count: number; resetAt: number }>()

export function memRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = _mem.get(key)
  if (!entry || entry.resetAt < now) {
    _mem.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }
  entry.count += 1
  return entry.count > limit
}

// ── KV-based (fails closed when KV_URL absent) ───────────────────────────────

/**
 * Check a KV rate limit. Returns true (= "is limited") when the caller
 * has exceeded `limit` within `windowSec` seconds.
 *
 * IMPORTANT: returns true (blocks the request) when KV_URL is not configured.
 * This is intentional — AI endpoints must not fire without rate-limit coverage.
 */
export async function kvRateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<boolean> {
  if (!process.env.KV_URL) return true // fail closed — no KV = no AI calls
  try {
    const { kv } = await import('@vercel/kv')
    const count = await kv.incr(key)
    if (count === 1) await kv.expire(key, windowSec)
    return count > limit
  } catch {
    return true // fail closed on KV errors too
  }
}

/**
 * Same as kvRateLimit but FAILS OPEN (allows through) when KV is absent.
 * Use only for non-cost-generating limits (analytics tracking, etc.).
 */
export async function kvRateLimitSoft(
  key: string,
  limit: number,
  windowSec: number
): Promise<boolean> {
  if (!process.env.KV_URL) return false
  try {
    const { kv } = await import('@vercel/kv')
    const count = await kv.incr(key)
    if (count === 1) await kv.expire(key, windowSec)
    return count > limit
  } catch {
    return false
  }
}
