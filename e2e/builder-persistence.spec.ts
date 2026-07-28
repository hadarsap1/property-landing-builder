import { test, expect, type Page, type APIRequestContext } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { createListing } from '../lib/db/queries/listings'

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
