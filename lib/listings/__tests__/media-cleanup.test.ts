import { describe, it, expect, vi, beforeEach } from 'vitest'

const rows = vi.hoisted(() => ({ value: [] as unknown[] }))
vi.mock('@/lib/db', () => ({
  sql: vi.fn(async () => ({ rows: rows.value })),
  db: { query: vi.fn(), connect: vi.fn() },
}))

import { collectListingMediaUrls } from '../media-cleanup'

const BLOB = 'https://abc.public.blob.vercel-storage.com'

describe('media cleanup', () => {
  beforeEach(() => { rows.value = [] })

  it('collects every stored image on a listing, without duplicates', async () => {
    rows.value = [{
      hero_image_url: `${BLOB}/b.jpg`,
      image_urls: [`${BLOB}/a.jpg`, `${BLOB}/b.jpg`],
      floor_plan_url: `${BLOB}/plan.jpg`,
    }]
    const urls = await collectListingMediaUrls(['l1'])
    expect(urls.sort()).toEqual([`${BLOB}/a.jpg`, `${BLOB}/b.jpg`, `${BLOB}/plan.jpg`])
  })

  it('never targets media the app does not own', async () => {
    // Users can paste arbitrary URLs; deleting those is not ours to do, and a
    // crafted hostname must not be able to point the deletion elsewhere.
    rows.value = [{
      hero_image_url: 'https://example.com/not-ours.jpg',
      image_urls: [
        'https://evil.com/x.jpg',
        'https://public.blob.vercel-storage.com.evil.com/y.jpg',
        `${BLOB}/mine.jpg`,
      ],
      floor_plan_url: null,
    }]
    expect(await collectListingMediaUrls(['l1'])).toEqual([`${BLOB}/mine.jpg`])
  })

  it('handles listings with no media and empty input', async () => {
    expect(await collectListingMediaUrls([])).toEqual([])
    rows.value = [{ hero_image_url: null, image_urls: null, floor_plan_url: null }]
    expect(await collectListingMediaUrls(['l1'])).toEqual([])
  })
})
