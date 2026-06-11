import { test, expect } from '@playwright/test'
import { FIXTURES } from './fixtures'

const LISTING_PATH = `/agency/${FIXTURES.agencySlug}/listings/${FIXTURES.listingSlug}`

test.describe('home page', () => {
  test('renders hero and footer without layout overflow', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('footer')).toContainText('hadarsap.online')

    // Phantom-space guard: document must end at the footer, no horizontal overflow
    const m = await page.evaluate(() => {
      const footer = document.querySelector('footer')!
      return {
        gap: document.documentElement.scrollHeight -
          Math.round(footer.getBoundingClientRect().bottom + window.scrollY),
        hOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }
    })
    expect(m.gap).toBeLessThanOrEqual(1)
    expect(m.hOverflow).toBeLessThanOrEqual(0)
  })
})

test.describe('public listing page', () => {
  test('renders content, JSON-LD, and contact CTAs', async ({ page }) => {
    await page.goto(LISTING_PATH)
    await expect(page.locator('h1')).toContainText('דירת חלומות')
    await expect(page.locator('#contact')).toContainText('מתעניינים בנכס?')

    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent()
    const parsed = JSON.parse(jsonLd!) as { '@type': string; offers?: { price: number } }
    expect(parsed['@type']).toBe('RealEstateListing')
    expect(parsed.offers?.price).toBe(2500000)
  })

  test('lead form submits successfully', async ({ page }) => {
    await page.goto(LISTING_PATH)
    await page.getByPlaceholder('שם מלא').fill('בודק אוטומטי')
    await page.getByPlaceholder('טלפון').first().fill('0501234567')
    await page.getByRole('button', { name: 'שלח פרטים' }).click()
    await expect(page.getByText('תודה! נחזור אליך בהקדם')).toBeVisible()
  })
})

test.describe('builder', () => {
  test('loads with a working live-preview iframe', async ({ page }) => {
    // Catches CSP regressions that block the same-origin preview frame
    await page.goto(`/builder?id=${FIXTURES.ownerlessListingId}`)
    const frame = page.locator('iframe[title="תצוגה מקדימה"]')
    if (await frame.count()) {
      // Desktop layout shows the preview pane; assert its document actually rendered
      const inner = page.frameLocator('iframe[title="תצוגה מקדימה"]')
      await expect(inner.locator('body')).not.toBeEmpty({ timeout: 15_000 })
    }
    // The wizard itself must render regardless of viewport
    await expect(page.getByText('פרטי הנכס').first()).toBeVisible()
  })
})

test.describe('listing API', () => {
  test('accepts a full builder save payload', async ({ request }) => {
    // Catches allowlist drift (the chat_qa incident): PATCH every field the
    // builder sends and expect success, not a 500
    const res = await request.patch(`/api/listings/${FIXTURES.ownerlessListingId}`, {
      data: {
        listing_type: 'sale', furniture: null,
        title: 'נכס מעודכן', street: 'הרצל 2', city: 'תל אביב', neighborhood: null,
        price: 1999999, price_on_request: false,
        built_area: 90, outdoor_area: null, rooms: 3, floor: 2, total_floors: 5,
        parking_spots: 1, parking_covered: true, has_storage: false, has_saferoom: true,
        has_elevator: true, air_directions: ['N'], build_year: 2010, renovation_year: null,
        bathrooms: 2, raw_description: 'תיאור', ai_title: null, ai_tagline: null,
        ai_story: null, ai_highlights: [], chat_qa: 'שאלות ותשובות',
        video_url: null, gallery_type: 'grid', carousel_speed: null,
        show_map: true, map_query_override: null, template_id: 'modern-blue',
        accent_color: '#2563eb', font_style: 'sans-serif',
        section_order: ['hero', 'story', 'specs', 'gallery', 'map', 'contact'],
        hidden_sections: [], seller_name: 'מוכר', seller_phone: '050-555-9999',
        seller_whatsapp: null, open_house_date: null, open_house_end: null,
      },
    })
    expect(res.status(), await res.text()).toBe(200)
    const body = (await res.json()) as { listing: { title: string; chat_qa: string } }
    expect(body.listing.title).toBe('נכס מעודכן')
    expect(body.listing.chat_qa).toBe('שאלות ותשובות')
  })

  test('rejects unknown columns instead of erroring', async ({ request }) => {
    const res = await request.patch(`/api/listings/${FIXTURES.ownerlessListingId}`, {
      data: { title: 'ok', evil_column: 'x' },
    })
    // Unknown keys are filtered by the allowlist — request succeeds without them
    expect(res.status()).toBe(200)
  })
})

test.describe('seo endpoints', () => {
  test('agency sitemap lists the listing', async ({ request }) => {
    const res = await request.get(`/agency/${FIXTURES.agencySlug}/sitemap.xml`)
    expect(res.status()).toBe(200)
    const xml = await res.text()
    expect(xml).toContain(`/listings/${FIXTURES.listingSlug}`)
  })

  test('robots.txt is served', async ({ request }) => {
    const res = await request.get('/robots.txt')
    expect(res.status()).toBe(200)
    expect(await res.text()).toContain('Disallow: /api/')
  })
})
