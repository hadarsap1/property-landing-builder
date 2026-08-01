import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { FIXTURES } from './fixtures'

/**
 * Automated conformance check against WCAG 2.0 A + AA — the standard Israeli
 * accessibility regulations point at via IS 5568 (ת"י 5568).
 *
 * Automation cannot certify compliance; it catches the machine-detectable
 * subset (contrast, names, roles, labels, landmarks). It is here so the
 * classes of defect that were fixed — a palette that failed contrast almost
 * everywhere, and `focus:outline-none` with no replacement — cannot creep
 * back in unnoticed.
 */
const PAGES: [string, string][] = [
  ['home', '/'],
  ['listing', `/agency/${FIXTURES.agencySlug}/listings/${FIXTURES.listingSlug}`],
  ['builder', `/builder?id=${FIXTURES.ownerlessListingId}`],
  ['login', '/auth/login'],
  ['pricing', '/pricing'],
  ['terms', '/terms'],
  ['privacy', '/privacy'],
  ['accessibility statement', '/accessibility'],
]

for (const [name, path] of PAGES) {
  test(`${name} has no WCAG 2.0 AA violations`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('domcontentloaded')

    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    // Name the offending rule and element so a failure is actionable.
    const detail = violations.flatMap((v) =>
      v.nodes.map((n) => `${v.id} @ ${String(n.target[0]).slice(0, 60)} — ${v.help}`)
    )
    expect(detail, `accessibility violations on ${path}`).toEqual([])
  })
}

test('the document declares Hebrew and RTL', async ({ page }) => {
  await page.goto('/')
  const html = page.locator('html')
  await expect(html).toHaveAttribute('lang', 'he')
  await expect(html).toHaveAttribute('dir', 'rtl')
})

test('a keyboard user can reach the content and see where they are', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')

  const skip = page.getByRole('link', { name: 'דלג לתוכן הראשי' })
  await expect(skip).toBeFocused()

  // The focus ring must actually be drawn — `focus:outline-none` used to
  // remove it app-wide, leaving keyboard users with no visible position.
  const outlineWidth = await skip.evaluate(
    (el) => getComputedStyle(el).outlineWidth
  )
  expect(parseFloat(outlineWidth)).toBeGreaterThan(0)
})
