import { test, expect, type Page, type APIRequestContext } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { createListing } from '../lib/db/queries/listings'
import { FIXTURES } from './fixtures'

/**
 * Regression cover for the three things users reported: work vanishing when
 * they came back to edit, text they typed not making it into the saved page,
 * and drafts bleeding between properties.
 *
 * These drive the real wizard against a real DB — the bugs they pin all lived
 * in the save/navigate lifecycle, where unit tests can't see them.
 *
 * "שכונה" (neighborhood) is the probe field throughout: a plain always-enabled
 * text input, unlike "רחוב" which stays disabled until a city is picked.
 */

const NEIGHBOURHOOD = 'שכונה'

/**
 * Each test edits its own listing. Sharing one row let tests running in
 * parallel overwrite each other's probe values and fail for reasons that had
 * nothing to do with the behaviour under test.
 *
 * Seeded straight through the DB layer: anonymous creation over the API is
 * deliberately fail-closed without KV, and these listings are left ownerless
 * so the builder opens them without a session.
 */
async function newListing(opts: { title?: string | null } = {}): Promise<string> {
  const listing = await createListing({
    agency_id: null,
    user_id: null,
    slug: `e2e-builder-${randomUUID()}`,
    title: opts.title === undefined ? 'בדיקת שמירה' : opts.title,
  })
  return listing.id
}

/** Read the persisted value straight from the API, so assertions can't race a page load. */
async function savedNeighbourhood(request: APIRequestContext, id: string): Promise<string | null> {
  const res = await request.get(`/api/listings/${id}`)
  if (!res.ok()) return null
  const body = (await res.json()) as { listing?: { neighborhood?: string | null } }
  return body.listing?.neighborhood ?? null
}

async function openBuilder(page: Page, id: string) {
  await page.goto(`/builder?id=${id}`)
  await expect(page.getByRole('heading', { name: 'פרטי הנכס' })).toBeVisible({ timeout: 15_000 })
}

test.describe('builder persistence', () => {
  test('text typed into a step survives a full reload', async ({ page }) => {
    const id = await newListing()
    await openBuilder(page, id)

    const unique = `נשמר-${Date.now()}`
    await page.getByLabel(NEIGHBOURHOOD).fill(unique)
    await expect(page.getByText('נשמר', { exact: true })).toBeVisible({ timeout: 15_000 })

    await page.reload()
    await expect(page.getByLabel(NEIGHBOURHOOD)).toHaveValue(unique, { timeout: 15_000 })
  })

  test('edits survive closing the page immediately after typing', async ({ page, request }) => {
    const id = await newListing()
    await openBuilder(page, id)

    const unique = `סגירה-${Date.now()}`
    await page.getByLabel(NEIGHBOURHOOD).fill(unique)

    // Leave at once — inside the 1.5s debounce window. The pending save used
    // to be thrown away here, losing the last thing the user typed.
    await page.goto('/')

    await expect
      .poll(async () => (await savedNeighbourhood(request, id)), { timeout: 15_000 })
      .toBe(unique)
  })

  test('edits survive using the exit link immediately after typing', async ({ page, request }) => {
    const id = await newListing()
    await openBuilder(page, id)

    const unique = `יציאה-${Date.now()}`
    await page.getByLabel(NEIGHBOURHOOD).fill(unique)

    // Same race, but via in-app navigation, which unmounts the wizard without
    // ever firing an unload event.
    const exit = page.getByRole('link', { name: /דף הבית|הנכסים שלי/ }).first()
    await expect(exit).toBeVisible()
    await exit.click()
    await expect(page).not.toHaveURL(/\/builder/, { timeout: 15_000 })

    await expect
      .poll(async () => (await savedNeighbourhood(request, id)), { timeout: 15_000 })
      .toBe(unique)
  })

  test('returning to edit lands inside the wizard, not the welcome screen', async ({ page }) => {
    // A property saved before its title was filled in — the exact case that
    // used to dump the owner back on the start/import chooser, which reads as
    // "my property is gone" and whose import option would overwrite it.
    const id = await newListing({ title: null })
    await page.goto(`/builder?id=${id}`)

    await expect(page.getByRole('heading', { name: 'פרטי הנכס' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('טענו ממודעה קיימת')).toHaveCount(0)
  })

  test('resumes on the step the user left off at', async ({ page }) => {
    const id = await newListing()
    await openBuilder(page, id)
    await page.getByRole('button', { name: /2\.\s*מפרט/ }).click()
    await expect(page.getByText('2 / 9 — מפרט')).toBeVisible()

    await page.reload()
    await expect(page.getByText('2 / 9 — מפרט')).toBeVisible({ timeout: 15_000 })
  })

  test('a saved property never leaks its draft into a new one', async ({ page }) => {
    const id = await newListing()
    await openBuilder(page, id)
    const marker = `דליפה-${Date.now()}`
    await page.getByLabel(NEIGHBOURHOOD).fill(marker)
    await expect(page.getByText('נשמר', { exact: true })).toBeVisible({ timeout: 15_000 })

    // Start a brand-new property: it must come up blank, not prefilled with
    // the property that was just being edited.
    await page.goto('/builder')
    await page.getByRole('button', { name: 'התחילו מאפס' }).click()
    await expect(page.getByRole('heading', { name: 'פרטי הנכס' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByLabel(NEIGHBOURHOOD)).not.toHaveValue(marker)
  })

  test('there is always a way out of the wizard', async ({ page }) => {
    const id = await newListing()
    await openBuilder(page, id)
    await expect(page.getByRole('link', { name: /דף הבית|הנכסים שלי/ }).first()).toBeVisible()
  })

  test('photos, floor plan and spec icons survive a save', async ({ request }) => {
    // Exercises the real jsonb + text[] binding, which unit tests can only fake.
    const id = await newListing()
    const patch = await request.patch(`/api/listings/${id}`, {
      data: {
        image_urls: ['https://blob.example.com/a.jpg', 'https://blob.example.com/b.jpg'],
        hero_image_url: 'https://blob.example.com/b.jpg',
        floor_plan_url: 'https://blob.example.com/plan.jpg',
        spec_icons: JSON.stringify({ rooms: '🛏️', parking: '🅿️' }),
      },
    })
    expect(patch.status(), await patch.text()).toBe(200)

    const res = await request.get(`/api/listings/${id}`)
    const body = (await res.json()) as {
      listing: {
        image_urls: string[]
        hero_image_url: string
        floor_plan_url: string
        spec_icons: Record<string, string>
      }
    }
    expect(body.listing.image_urls).toEqual([
      'https://blob.example.com/a.jpg',
      'https://blob.example.com/b.jpg',
    ])
    expect(body.listing.hero_image_url).toBe('https://blob.example.com/b.jpg')
    expect(body.listing.floor_plan_url).toBe('https://blob.example.com/plan.jpg')
    // Comes back parsed, not as a JSON string
    expect(body.listing.spec_icons).toEqual({ rooms: '🛏️', parking: '🅿️' })
  })

  test('junk spec icons are rejected rather than stored', async ({ request }) => {
    const id = await newListing()
    const patch = await request.patch(`/api/listings/${id}`, {
      data: { spec_icons: { rooms: '🛏️', evil: '<script>', floor: 'x'.repeat(500) } },
    })
    expect(patch.status(), await patch.text()).toBe(200)

    const res = await request.get(`/api/listings/${id}`)
    const body = (await res.json()) as { listing: { spec_icons: Record<string, string> } }
    expect(body.listing.spec_icons).toEqual({ rooms: '🛏️' })
  })

  test('the cookie banner never covers the wizard navigation', async ({ page, context }) => {
    const id = await newListing()
    // First-ever visit, so the consent banner is showing.
    await context.clearCookies()
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())

    await openBuilder(page, id)
    await expect(page.getByRole('dialog', { name: 'הסכמה לשימוש בעוגיות' })).toBeVisible()

    // The nav buttons used to sit underneath the banner, so a first-time user
    // could not advance the wizard at all. Ask the browser what is actually on
    // top at each button's centre — "next" is disabled until a city is filled,
    // so a click alone can't tell us whether it is reachable.
    const blocked = await page.evaluate(() => {
      const labels = ['הבא', 'הקודם', 'סיום']
      const buttons = [...document.querySelectorAll('button, a')].filter((el) =>
        labels.some((l) => el.textContent?.trim().startsWith(l))
      )
      return buttons
        .filter((el) => {
          const r = el.getBoundingClientRect()
          if (!r.width || !r.height) return false
          const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
          return !(top && (el === top || el.contains(top)))
        })
        .map((el) => el.textContent?.trim().slice(0, 12))
    })
    expect(blocked).toEqual([])
  })
})

/**
 * The builder falls back to a local preview URL when Blob storage rejects an
 * upload — which it always does for a signed-out user, and also does when the
 * blob token is missing, the daily quota is hit, or the file is too big. That
 * preview cannot be saved, so the wizard must say so instead of showing the
 * photo, reporting "נשמר", and dropping it.
 */
test.describe('image upload failures are visible', () => {
  const PIXEL = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  )

  test('an upload that cannot be stored is reported, not silently dropped', async ({ page }) => {
    const id = await newListing()
    await openBuilder(page, id)
    await page.getByRole('button', { name: /4\.\s*תמונות/ }).click()

    await page.setInputFiles('input[type="file"]', {
      name: 'room.png', mimeType: 'image/png', buffer: PIXEL,
    })

    // The failure has to reach the user, with a way to act on it.
    await expect(page.getByRole('alert').filter({ hasText: 'לא נשמרה' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'נסה להעלות שוב' })).toBeVisible()
  })


  test('the wizard falls back to the anonymous endpoint after a 401', async ({ page }) => {
    // Proves the wiring: a signed-out upload must retry against the listing-
    // scoped route rather than giving up and keeping a throwaway preview.
    const id = await newListing()
    const calls: string[] = []
    page.on('request', (r) => {
      if (r.url().includes('/api/blob/')) calls.push(r.url())
    })

    await openBuilder(page, id)
    await page.getByRole('button', { name: /4\.\s*תמונות/ }).click()
    await page.setInputFiles('input[type="file"]', {
      name: 'room.png', mimeType: 'image/png', buffer: PIXEL,
    })
    await expect(page.getByRole('alert').filter({ hasText: 'לא נשמרה' })).toBeVisible({ timeout: 15_000 })

    expect(calls.some((u) => u.endsWith('/api/blob/upload'))).toBe(true)
    expect(calls.some((u) => u.includes(`/api/blob/upload-anon?listingId=${id}`))).toBe(true)
  })

  test('a stored photo shows no warning and survives a reload', async ({ page, request }) => {
    const id = await newListing()
    // Stand in for a successful Blob upload.
    const stored = 'https://x.public.blob.vercel-storage.com/room.jpg'
    const res = await request.patch(`/api/listings/${id}`, {
      data: { image_urls: [stored], hero_image_url: stored },
    })
    expect(res.status()).toBe(200)

    await openBuilder(page, id)
    await page.getByRole('button', { name: /4\.\s*תמונות/ }).click()

    await expect(page.getByText('לא נשמרה')).toHaveCount(0)
    await page.reload()
    await page.getByRole('button', { name: /4\.\s*תמונות/ }).click()
    await expect(page.locator(`img[src="${stored}"]`).first()).toBeAttached({ timeout: 15_000 })
  })
})

/**
 * The anonymous upload endpoint is the one unauthenticated write path in the
 * app, so its guards are what stand between the builder and a spam target.
 * These pin the guards rather than the happy path, which needs Blob + KV.
 */
test.describe('anonymous upload endpoint guards', () => {
  const PIXEL = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  )
  const file = { name: 'room.png', mimeType: 'image/png', buffer: PIXEL }

  test('refuses an upload that names no listing', async ({ request }) => {
    const res = await request.post('/api/blob/upload-anon', { multipart: { file } })
    expect(res.status()).toBe(400)
  })

  test('refuses a listing that does not exist', async ({ request }) => {
    const res = await request.post(
      `/api/blob/upload-anon?listingId=${randomUUID()}`,
      { multipart: { file } }
    )
    expect(res.status()).toBe(404)
  })

  test('refuses a listing that already has an owner', async ({ request }) => {
    // Owned listings must bill against their account via the authenticated route.
    const owned = await createListing({
      agency_id: FIXTURES.agencyId,
      user_id: null,
      slug: `e2e-owned-${randomUUID()}`,
      title: 'בבעלות',
    })
    const res = await request.post(
      `/api/blob/upload-anon?listingId=${owned.id}`,
      { multipart: { file } }
    )
    expect(res.status()).toBe(403)
  })

  test('does not accept uploads without rate limiting available', async ({ request }) => {
    // Fail-closed: no KV (or no Blob token) must mean no anonymous upload,
    // never an uncounted one.
    const id = await newListing()
    const res = await request.post(
      `/api/blob/upload-anon?listingId=${id}`,
      { multipart: { file } }
    )
    expect(res.ok()).toBeFalsy()
    expect([429, 503]).toContain(res.status())
  })
})
