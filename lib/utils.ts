/** Escape HTML special chars so user content can't inject markup into emails. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitize a client-supplied image id before using it in a Vercel Blob key.
 * Strips anything that isn't alphanumeric / dash / underscore, caps at 64 chars.
 */
export function safeBlobId(id: string): string {
  const clean = (id ?? '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  if (clean) return clean;
  // Fallback: 12 random hex chars (~48 bits of entropy, safe for a storage key)
  const buf = new Uint8Array(6);
  if (typeof globalThis.crypto !== 'undefined') {
    globalThis.crypto.getRandomValues(buf);
  } else {
    // Node.js <19 — use require lazily to stay ESM-compatible
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { randomFillSync } = require('node:crypto') as typeof import('node:crypto');
    randomFillSync(buf);
  }
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Validate a listing lifecycle status value. */
export function isValidStatus(v: unknown): v is 'available' | 'sold' | 'rented' {
  return v === 'available' || v === 'sold' || v === 'rented';
}
