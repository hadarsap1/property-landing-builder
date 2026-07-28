import { describe, it, expect } from 'vitest'
import { listingToProject, projectToListingData } from '../adapt'
import type { Listing } from '@/lib/db/types'
import type { PropertyProject } from '@/types/project'

/**
 * The builder autosaves by running projectToListingData() and PATCHing the
 * result, then reloads an edit session via listingToProject(). Anything that
 * doesn't survive that round trip is work the user loses when they come back
 * to edit — so these tests pin the round trip field by field.
 */

const PROJECT: PropertyProject = {
  listingType: 'sale',
  title: 'דירת גן',
  street: 'הרצל 5',
  city: 'תל אביב',
  neighborhood: 'הצפון הישן',
  price: 3_500_000,
  priceOnRequest: false,
  furniture: 'partial',
  builtArea: 120,
  gardenArea: 40,
  rooms: 4,
  floor: 2,
  totalFloors: 5,
  parkingSpots: 1,
  parkingType: 'covered',
  hasStorage: true,
  hasSaferoom: true,
  hasElevator: true,
  airDirections: ['N', 'S'],
  buildYear: 2001,
  renovationYear: 2019,
  bathrooms: 2,
  rawStory: 'הסיפור הגולמי שכתב המשתמש',
  aiTitle: 'דירת גן מהממת',
  aiTagline: 'נוף פתוח לפארק',
  aiStory: 'סיפור שנוצר ונערך ידנית',
  aiHighlights: ['מרפסת ענקית', 'חניה מקורה'],
  chatQA: 'ש: מתי אפשר להיכנס? ת: מיידי',
  images: [
    { id: '0', dataUrl: 'https://blob.example.com/a.jpg', name: 'a' },
    { id: '1', dataUrl: 'https://blob.example.com/b.jpg', name: 'b' },
    { id: '2', dataUrl: 'https://blob.example.com/c.jpg', name: 'c' },
  ],
  heroImageIndex: 1,
  galleryType: 'auto-5s',
  videoUrl: 'https://blob.example.com/v.mp4',
  floorPlan: null,
  showMap: true,
  mapQuery: 'הרצל 5, תל אביב, ישראל',
  template: 'urban-bold',
  accentColor: '#c0392b',
  fontStyle: 'display',
  sectionOrder: ['hero', 'gallery', 'story', 'specs', 'map', 'contact'],
  sectionVisibility: { hero: true, story: true, specs: false, gallery: true, map: true, contact: true },
  specIcons: {},
  sellerName: 'ישראל ישראלי',
  phone: '0501234567',
  whatsapp: '0501234567',
  openHouseDate: '',
  openHouseEnd: '',
}

/** Simulate the DB: apply a PATCH payload onto a row, then read it back. */
function roundTrip(project: PropertyProject): PropertyProject {
  const patch = projectToListingData(project)
  const row = {
    id: 'l1',
    agency_id: null,
    user_id: null,
    agent_id: null,
    slug: 'x',
    status: 'active',
    auto_paused: false,
    created_at: new Date(),
    updated_at: new Date(),
    ...patch,
  } as unknown as Listing
  return listingToProject(row)
}

describe('builder autosave round trip', () => {
  it('preserves uploaded photos and the chosen hero image', () => {
    const out = roundTrip(PROJECT)
    expect(out.images.map((i) => i.dataUrl)).toEqual([
      'https://blob.example.com/a.jpg',
      'https://blob.example.com/b.jpg',
      'https://blob.example.com/c.jpg',
    ])
    expect(out.heroImageIndex).toBe(1)
  })

  it('preserves every text field the user wrote', () => {
    const out = roundTrip(PROJECT)
    expect(out.title).toBe(PROJECT.title)
    expect(out.rawStory).toBe(PROJECT.rawStory)
    expect(out.aiTitle).toBe(PROJECT.aiTitle)
    expect(out.aiTagline).toBe(PROJECT.aiTagline)
    expect(out.aiStory).toBe(PROJECT.aiStory)
    expect(out.aiHighlights).toEqual(PROJECT.aiHighlights)
    expect(out.chatQA).toBe(PROJECT.chatQA)
    expect(out.sellerName).toBe(PROJECT.sellerName)
    expect(out.neighborhood).toBe(PROJECT.neighborhood)
  })

  it('preserves specs, design and layout choices', () => {
    const out = roundTrip(PROJECT)
    expect(out.rooms).toBe(4)
    expect(out.parkingType).toBe('covered')
    expect(out.airDirections).toEqual(['N', 'S'])
    expect(out.galleryType).toBe('auto-5s')
    expect(out.template).toBe('urban-bold')
    expect(out.accentColor).toBe('#c0392b')
    expect(out.fontStyle).toBe('display')
    expect(out.sectionOrder).toEqual(PROJECT.sectionOrder)
    expect(out.sectionVisibility.specs).toBe(false)
    expect(out.sectionVisibility.hero).toBe(true)
  })

  it('keeps images that are still uploading out of the DB payload', () => {
    // Step4 shows a local object URL placeholder until the blob upload resolves.
    // Persisting those would store dead links.
    const patch = projectToListingData({
      ...PROJECT,
      images: [
        { id: '0', dataUrl: 'https://blob.example.com/a.jpg', name: 'a' },
        { id: '1', dataUrl: 'blob:http://localhost/pending', name: 'b' },
      ],
      heroImageIndex: 0,
    })
    expect(patch.image_urls).toEqual(['https://blob.example.com/a.jpg'])
  })

  it('falls back to the first photo when the hero index is out of range', () => {
    const patch = projectToListingData({ ...PROJECT, heroImageIndex: 99 })
    expect(patch.hero_image_url).toBe('https://blob.example.com/a.jpg')
  })
})
