import { test, expect } from '@playwright/test'

/**
 * The subscription renews itself through Stripe, which makes it an ongoing
 * transaction under the Consumer Protection Law: the price actually charged,
 * the automatic renewal, and how to stop it all have to be disclosed rather
 * than left to the checkout screen. These are easy to lose in a redesign.
 */
test.describe('subscription disclosure', () => {
  test('prices state that VAT is included', async ({ page }) => {
    await page.goto('/pricing')
    // Both plans, not just the first one.
    await expect(page.getByText('כולל מע״מ')).toHaveCount(2)
  })

  test('terms disclose auto-renewal, cancellation and what happens to unused time', async ({ page }) => {
    await page.goto('/terms')
    const body = page.locator('body')
    await expect(body).toContainText('מתחדש אוטומטית')
    await expect(body).toContainText('ניתן לבטל את המנוי בכל עת')
    await expect(body).toContainText('לא מבוצע החזר יחסי')
    await expect(body).toContainText('כוללים מע״מ')
  })

  test('the pricing page still says how to cancel, next to the price', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByText('ביטול בכל עת').first()).toBeVisible()
  })
})
