import { describe, it, expect, vi } from 'vitest'

// Mock DB so we can import the query modules without @vercel/postgres installed
vi.mock('@/lib/db', () => ({ sql: vi.fn(), db: { query: vi.fn(), connect: vi.fn() } }))
vi.mock('bcryptjs', () => ({ default: { hash: vi.fn(), compare: vi.fn() } }))

import {
  LISTING_COLUMNS,
  CLIENT_WRITABLE_COLUMNS,
  assertListingColumns,
} from '../listings'
import { projectToListingData } from '@/lib/listings/adapt'
import type { PropertyProject } from '@/types/project'
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

describe('allowlist consistency', () => {
  it('every column the builder saves passes assertListingColumns', () => {
    // Regression: chat_qa was once writable via PATCH but missing from
    // LISTING_COLUMNS, so every builder autosave threw and returned 500.
    // projectToListingData produces exactly what the builder PATCHes.
    const emptyProject = {
      listingType: 'sale', title: '', street: '', city: '', neighborhood: '',
      price: null, priceOnRequest: false, furniture: '', builtArea: null,
      gardenArea: null, rooms: null, floor: null, totalFloors: null,
      parkingSpots: null, parkingType: '', hasStorage: false, hasSaferoom: false,
      hasElevator: false, airDirections: [], buildYear: null, renovationYear: null,
      bathrooms: null, rawStory: '', aiTitle: '', aiTagline: '', aiStory: '',
      aiHighlights: [], chatQA: '', images: [], heroImageIndex: 0,
      galleryType: 'grid', videoUrl: '', showMap: true, mapQuery: '',
      template: 'modern-blue', accentColor: '', fontStyle: 'sans-serif',
      sectionOrder: [], sectionVisibility: {}, specIcons: {},
      sellerName: '', phone: '', whatsapp: '', openHouseDate: '', openHouseEnd: '',
    } as unknown as PropertyProject
    const saved = projectToListingData(emptyProject)
    expect(() => assertListingColumns(saved)).not.toThrow()
  })

  it('client-writable set is a subset of LISTING_COLUMNS', () => {
    for (const col of CLIENT_WRITABLE_COLUMNS) {
      expect(LISTING_COLUMNS.has(col), `"${col}" writable but not a known column`).toBe(true)
    }
  })

  it('server-managed columns are not client-writable', () => {
    for (const col of ['agency_id', 'user_id', 'agent_id', 'slug']) {
      expect(CLIENT_WRITABLE_COLUMNS.has(col), `"${col}" must not be client-writable`).toBe(false)
    }
  })
})

describe('assertListingColumns', () => {
  it('passes for all known columns', () => {
    const valid: Record<string, unknown> = { title: 'test', city: 'TA', price: 1_000_000 }
    expect(() => assertListingColumns(valid)).not.toThrow()
  })

  it('throws on unknown column', () => {
    expect(() => assertListingColumns({ ['__proto__']: 'x' })).toThrow('Invalid listing column')
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
