import { NextRequest, NextResponse } from 'next/server';

// ── Rate limiter ──────────────────────────────────────────────────────────────
// Uses Vercel KV (atomic INCR + TTL) when configured, so limits hold across
// serverless instances. Falls back to a per-instance in-memory window when KV
// is absent or errors — still blunts scripted abuse in dev / degraded modes.

interface Entry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Entry>();

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export interface RateLimitOptions {
  /** Unique bucket name (usually the route). */
  name: string;
  /** Max requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

function tooMany(resetMs: number): NextResponse {
  const retryAfter = Math.max(1, Math.ceil(resetMs / 1000));
  return NextResponse.json(
    { error: 'יותר מדי בקשות, נסו שוב בעוד רגע' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  );
}

function memoryLimit(key: string, opts: RateLimitOptions): NextResponse | null {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return null;
  }
  if (entry.count >= opts.limit) return tooMany(entry.resetAt - now);
  entry.count += 1;
  return null;
}

/**
 * Returns a 429 NextResponse if the caller has exceeded the limit, else null.
 * Usage: `const limited = await rateLimit(req, {...}); if (limited) return limited;`
 */
export async function rateLimit(
  req: NextRequest,
  opts: RateLimitOptions
): Promise<NextResponse | null> {
  const key = `rl:${opts.name}:${clientIp(req)}`;

  if (process.env.KV_URL) {
    try {
      const { kv } = await import('@vercel/kv');
      const count = await kv.incr(key);
      if (count === 1) {
        await kv.expire(key, Math.ceil(opts.windowMs / 1000));
      }
      if (count > opts.limit) {
        const ttl = await kv.ttl(key); // seconds remaining
        return tooMany((ttl > 0 ? ttl : Math.ceil(opts.windowMs / 1000)) * 1000);
      }
      return null;
    } catch {
      // KV unavailable — fall through to in-memory so we still apply *some* limit.
    }
  }

  return memoryLimit(key, opts);
}

// Opportunistic cleanup so the in-memory Map can't grow unbounded.
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of buckets) {
      if (entry.resetAt <= now) buckets.delete(key);
    }
  }, 5 * 60 * 1000).unref?.();
}
