import { describe, it, expect, vi } from 'vitest'

// Mock DB so we can import the query modules without @vercel/postgres installed
vi.mock('@/lib/db', () => ({ sql: vi.fn(), db: { query: vi.fn(), connect: vi.fn() } }))
vi.mock('bcryptjs', () => ({ default: { hash: vi.fn(), compare: vi.fn() } }))

import {
  LISTING_COLUMNS,
  assertListingColumns,
} from '../listings'
import { AGENT_WRITABLE_COLUMNS } from '../agents'
import { AGENCY_WRITABLE_COLUMNS } from '../agencies'

describe('LISTING_COLUMNS allowlist', () => {
  it('contains expected writable columns', () => {
    const required = [
      'agency_id', 'user_id', 'slug', 'status', 'title', 'street', 'city',
      'price', 'hero_image_url', 'seller_name', 'seller_phone',
    ]
    for (const col of required) {
      expect(LISTING_COLUMNS.has(col), `expected "${col}" in LISTING_COLUMNS`).toBe(true)
    }
  })

  it('does not contain injection vectors', () => {
    const dangerous = ['__proto__', 'constructor', 'prototype', 'id', 'created_at']
    for (const col of dangerous) {
      expect(LISTING_COLUMNS.has(col), `"${col}" should not be in LISTING_COLUMNS`).toBe(false)
    }
  })
})

describe('assertListingColumns', () => {
  it('passes for all known columns', () => {
    const valid: Record<string, unknown> = { title: 'test', city: 'TA', price: 1_000_000 }
    expect(() => assertListingColumns(valid)).not.toThrow()
  })

  it('throws on unknown column', () => {
    expect(() => assertListingColumns({ __proto__: 'x' })).toThrow('Invalid listing column')
    expect(() => assertListingColumns({ id: '123' })).toThrow('Invalid listing column')
    expect(() => assertListingColumns({ unknown_col: 1 })).toThrow('Invalid listing column')
  })

  it('throws even when mixed with valid columns', () => {
    expect(() => assertListingColumns({ title: 'ok', injected: 'bad' })).toThrow('Invalid listing column')
  })
})

describe('AGENT_WRITABLE_COLUMNS allowlist', () => {
  it('allows only agent-editable fields', () => {
    expect(AGENT_WRITABLE_COLUMNS.has('name')).toBe(true)
    expect(AGENT_WRITABLE_COLUMNS.has('role')).toBe(true)
    expect(AGENT_WRITABLE_COLUMNS.has('email')).toBe(false)  // email changes are not allowed here
    expect(AGENT_WRITABLE_COLUMNS.has('agency_id')).toBe(false)
    expect(AGENT_WRITABLE_COLUMNS.has('id')).toBe(false)
    expect(AGENT_WRITABLE_COLUMNS.has('__proto__')).toBe(false)
  })
})

describe('AGENCY_WRITABLE_COLUMNS allowlist', () => {
  it('allows only agency-editable fields', () => {
    expect(AGENCY_WRITABLE_COLUMNS.has('name')).toBe(true)
    expect(AGENCY_WRITABLE_COLUMNS.has('contact_email')).toBe(true)
    expect(AGENCY_WRITABLE_COLUMNS.has('id')).toBe(false)
    expect(AGENCY_WRITABLE_COLUMNS.has('slug')).toBe(false)
    expect(AGENCY_WRITABLE_COLUMNS.has('__proto__')).toBe(false)
  })
})
