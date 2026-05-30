import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Minimal NextRequest stub ──────────────────────────────────────────────────
function makeReq(ip: string) {
  return {
    headers: { get: (k: string) => (k === 'x-forwarded-for' ? ip : null) },
  } as unknown as import('next/server').NextRequest;
}

// Isolate the in-memory Map across tests by re-importing after vi.resetModules
beforeEach(() => {
  vi.resetModules();
});

describe('rateLimit (in-memory fallback, no KV)', () => {
  it('allows requests up to the limit', async () => {
    // Fresh module import so the Map is empty
    const { rateLimit } = await import('../rate-limit');
    const opts = { name: `t-${Date.now()}`, limit: 3, windowMs: 60_000 };
    for (let i = 0; i < 3; i++) {
      const result = await rateLimit(makeReq('1.2.3.4'), opts);
      expect(result).toBeNull();
    }
  });

  it('returns 429 after the limit is exceeded', async () => {
    const { rateLimit } = await import('../rate-limit');
    const opts = { name: `t-${Date.now()}`, limit: 2, windowMs: 60_000 };
    await rateLimit(makeReq('5.6.7.8'), opts);
    await rateLimit(makeReq('5.6.7.8'), opts);
    const res = await rateLimit(makeReq('5.6.7.8'), opts);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
  });

  it('counts per IP — different IPs are independent', async () => {
    const { rateLimit } = await import('../rate-limit');
    const opts = { name: `t-${Date.now()}`, limit: 1, windowMs: 60_000 };
    const r1 = await rateLimit(makeReq('10.0.0.1'), opts);
    const r2 = await rateLimit(makeReq('10.0.0.2'), opts);
    expect(r1).toBeNull();
    expect(r2).toBeNull();
  });
});
