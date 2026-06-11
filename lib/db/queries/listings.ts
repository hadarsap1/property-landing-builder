import { sql, db } from '@/lib/db'
import type { Listing } from '@/lib/db/types'

type PgValue = string | number | boolean | string[] | null

// Exhaustive list of columns that may be written to the listings table.
// Every caller of buildInsert/buildUpdate for listings must pass only these keys.
export const LISTING_COLUMNS = new Set([
  'agency_id', 'user_id', 'agent_id', 'slug', 'status', 'listing_type', 'furniture',
  'title', 'street', 'city', 'neighborhood', 'price', 'price_on_request',
  'built_area', 'outdoor_area', 'rooms', 'floor', 'total_floors',
  'parking_spots', 'parking_covered', 'has_storage', 'has_saferoom',
  'has_elevator', 'air_directions', 'build_year', 'renovation_year', 'bathrooms',
  'raw_description', 'ai_title', 'ai_tagline', 'ai_story', 'ai_highlights', 'chat_qa',
  'hero_image_url', 'image_urls', 'video_url', 'gallery_type', 'carousel_speed',
  'show_map', 'map_query_override', 'template_id', 'accent_color', 'font_style',
  'section_order', 'hidden_sections', 'seller_name', 'seller_phone', 'seller_whatsapp',
  'open_house_date', 'open_house_end',
])

export function assertListingColumns(data: Record<string, unknown>): void {
  for (const key of Object.keys(data)) {
    if (!LISTING_COLUMNS.has(key)) throw new Error(`Invalid listing column: ${key}`)
  }
}

// Columns the server assigns itself — clients may never write these via the API.
const SERVER_MANAGED_COLUMNS = new Set(['agency_id', 'user_id', 'agent_id', 'slug'])

/** Columns clients may PATCH. Derived from LISTING_COLUMNS so the two sets can't drift. */
export const CLIENT_WRITABLE_COLUMNS = new Set(
  [...LISTING_COLUMNS].filter((c) => !SERVER_MANAGED_COLUMNS.has(c))
)

// Transliterate Hebrew characters so slugs remain readable even for Hebrew city/street names.
const HE_MAP: Record<string, string> = {
  'א':'a','ב':'b','ג':'g','ד':'d','ה':'h','ו':'v','ז':'z','ח':'ch','ט':'t',
  'י':'y','כ':'k','ך':'k','ל':'l','מ':'m','ם':'m','נ':'n','ן':'n','ס':'s',
  'ע':'a','פ':'p','ף':'p','צ':'ts','ץ':'ts','ק':'k','ר':'r','ש':'sh','ת':'t',
}

function slugify(raw: string): string {
  const transliterated = raw.split('').map(c => HE_MAP[c] ?? c).join('')
  return transliterated
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

function buildInsert(table: string, data: Record<string, PgValue>) {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined)
  const cols = entries.map(([k]) => k).join(', ')
  const values = entries.map(([, v]) => v)
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')
  return { text: `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) RETURNING *`, values }
}

function buildUpdate(table: string, id: string, data: Record<string, PgValue>) {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined)
  const sets = entries.map(([k], i) => `${k} = $${i + 1}`).join(', ')
  const values = entries.map(([, v]) => v)
  return {
    text: `UPDATE ${table} SET ${sets} WHERE id = $${values.length + 1} RETURNING *`,
    values: [...values, id],
  }
}

export async function getListingsByAgency(
  agencyId: string,
  opts: { limit?: number; offset?: number } = {}
): Promise<Listing[]> {
  const limit = opts.limit ?? 100
  const offset = opts.offset ?? 0
  const { rows } = await sql<Listing>`
    SELECT * FROM listings WHERE agency_id = ${agencyId}
    ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
  `
  return rows
}

/** Lean slug list for sitemap generation — active listings only. */
export async function getActiveListingSlugs(
  agencyId: string
): Promise<{ slug: string; updated_at: Date }[]> {
  const { rows } = await sql<{ slug: string; updated_at: Date }>`
    SELECT slug, updated_at FROM listings
    WHERE agency_id = ${agencyId} AND status = 'active'
    ORDER BY updated_at DESC
    LIMIT 5000
  `
  return rows
}

export async function getListingById(id: string): Promise<Listing | null> {
  const { rows } = await sql<Listing>`
    SELECT * FROM listings WHERE id = ${id} LIMIT 1
  `
  return rows[0] ?? null
}

export async function getListingBySlug(agencyId: string, slug: string): Promise<Listing | null> {
  const { rows } = await sql<Listing>`
    SELECT * FROM listings WHERE agency_id = ${agencyId} AND slug = ${slug} LIMIT 1
  `
  return rows[0] ?? null
}

export async function getListingsByUser(
  userId: string,
  opts: { limit?: number; offset?: number } = {}
): Promise<Listing[]> {
  const limit = opts.limit ?? 100
  const offset = opts.offset ?? 0
  const { rows } = await sql<Listing>`
    SELECT * FROM listings WHERE user_id = ${userId}
    ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
  `
  return rows
}

export async function getListingByIdForUser(id: string, userId: string): Promise<Listing | null> {
  const { rows } = await sql<Listing>`
    SELECT * FROM listings WHERE id = ${id} AND user_id = ${userId} LIMIT 1
  `
  return rows[0] ?? null
}

export async function slugExistsForUser(userId: string, slug: string): Promise<boolean> {
  const { rows } = await sql`
    SELECT 1 FROM listings WHERE user_id = ${userId} AND slug = ${slug} LIMIT 1
  `
  return rows.length > 0
}

export async function generateUniqueSlugForUser(userId: string, base: string): Promise<string> {
  const clean = slugify(base) || 'listing'
  let slug = clean
  let n = 1
  while (await slugExistsForUser(userId, slug)) {
    slug = `${clean}-${n++}`
  }
  return slug
}

export async function createListing(data: {
  agency_id?: string | null
  user_id?: string | null
  agent_id?: string | null
  slug: string
  [key: string]: PgValue | undefined
}): Promise<Listing> {
  assertListingColumns(data)
  const { text, values } = buildInsert('listings', data as Record<string, PgValue>)
  const { rows } = await db.query<Listing>(text, values)
  return rows[0]
}

export async function updateListing(
  id: string,
  data: Record<string, PgValue>
): Promise<Listing | null> {
  if (Object.keys(data).length === 0) return getListingById(id)
  assertListingColumns(data)
  const { text, values } = buildUpdate('listings', id, data)
  const { rows } = await db.query<Listing>(text, values)
  return rows[0] ?? null
}

export async function deleteListing(id: string): Promise<void> {
  await sql`DELETE FROM listings WHERE id = ${id}`
}

export async function slugExists(agencyId: string, slug: string): Promise<boolean> {
  const { rows } = await sql`
    SELECT 1 FROM listings WHERE agency_id = ${agencyId} AND slug = ${slug} LIMIT 1
  `
  return rows.length > 0
}

export async function generateUniqueSlug(agencyId: string, base: string): Promise<string> {
  const clean = slugify(base) || 'listing'
  let slug = clean
  let n = 1
  while (await slugExists(agencyId, slug)) {
    slug = `${clean}-${n++}`
  }
  return slug
}
