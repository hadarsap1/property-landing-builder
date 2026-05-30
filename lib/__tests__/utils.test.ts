import { describe, it, expect } from 'vitest';
import { escapeHtml, safeBlobId, isValidStatus } from '../utils';

describe('escapeHtml', () => {
  it('escapes < > & " \'', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });
  it('escapes ampersand', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });
  it("escapes single quote", () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });
  it('returns plain text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });
});

describe('safeBlobId', () => {
  it('passes through a valid id', () => {
    expect(safeBlobId('abc-123_XYZ')).toBe('abc-123_XYZ');
  });
  it('strips path traversal characters', () => {
    const result = safeBlobId('../../../etc/passwd');
    expect(result).not.toContain('/');
    expect(result).not.toContain('.');
    expect(result.length).toBeGreaterThan(0);
  });
  it('caps at 64 characters', () => {
    expect(safeBlobId('a'.repeat(100)).length).toBeLessThanOrEqual(64);
  });
  it('returns a non-empty fallback for empty input', () => {
    expect(safeBlobId('').length).toBeGreaterThan(0);
  });
  it('returns a non-empty fallback for all-special input', () => {
    expect(safeBlobId('!@#$%^&*()').length).toBeGreaterThan(0);
  });
});

describe('isValidStatus', () => {
  it('accepts valid statuses', () => {
    expect(isValidStatus('available')).toBe(true);
    expect(isValidStatus('sold')).toBe(true);
    expect(isValidStatus('rented')).toBe(true);
  });
  it('rejects unknown strings', () => {
    expect(isValidStatus('deleted')).toBe(false);
    expect(isValidStatus('')).toBe(false);
    expect(isValidStatus('SOLD')).toBe(false);
  });
  it('rejects non-string types', () => {
    expect(isValidStatus(null)).toBe(false);
    expect(isValidStatus(undefined)).toBe(false);
    expect(isValidStatus(1)).toBe(false);
  });
});
