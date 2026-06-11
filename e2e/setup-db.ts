/**
 * Prepare the E2E database: full schema + deterministic fixtures.
 * Runs against POSTGRES_URL (a plain local/CI Postgres — lib/db falls
 * back to node-postgres for localhost URLs).
 *
 * Usage: POSTGRES_URL=postgresql://e2e:e2e@localhost:5432/e2e npx tsx e2e/setup-db.ts
 */
import { ensureSchema } from '../lib/db/ensure-schema'
import { db } from '../lib/db'
import { FIXTURES } from './fixtures'

async function main() {
  await ensureSchema()

  const c = await db.connect()
  try {
    await c.query(
      `INSERT INTO agencies (id, slug, name, primary_color, contact_email, contact_phone)
       VALUES ($1, $2, 'E2E Agency', '#2563eb', 'e2e@example.com', '03-5551234')
       ON CONFLICT (id) DO NOTHING`,
      [FIXTURES.agencyId, FIXTURES.agencySlug]
    )

    // Active subscription so public agency pages don't 404 behind the billing gate
    await c.query(
      `INSERT INTO subscriptions (agency_id, status, trial_ends_at)
       VALUES ($1, 'trialing', now() + interval '30 days')
       ON CONFLICT (agency_id) DO NOTHING`,
      [FIXTURES.agencyId]
    )

    await c.query(
      `INSERT INTO listings (id, agency_id, slug, status, title, ai_title, ai_tagline, ai_story,
                             street, city, price, rooms, built_area, floor, total_floors,
                             seller_name, seller_phone, section_order)
       VALUES ($1, $2, $3, 'active', 'דירת בדיקה', 'דירת חלומות בלב העיר', 'נוף פתוח לים',
               'סיפור הדירה לבדיקות אוטומטיות.', 'הרצל 1', 'תל אביב', 2500000, 4, 100, 3, 8,
               'ישראל ישראלי', '050-555-1234', ARRAY['hero','story','specs','gallery','map','contact'])
       ON CONFLICT (id) DO NOTHING`,
      [FIXTURES.listingId, FIXTURES.agencyId, FIXTURES.listingSlug]
    )

    // Ownerless listing — exercises the anonymous-builder PATCH path
    await c.query(
      `INSERT INTO listings (id, slug, status, title)
       VALUES ($1, 'e2e-ownerless', 'active', 'נכס ללא בעלים')
       ON CONFLICT (id) DO NOTHING`,
      [FIXTURES.ownerlessListingId]
    )
  } finally {
    c.release()
  }
  console.log('E2E database ready')
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
