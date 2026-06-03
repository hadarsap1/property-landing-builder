import { sql, db } from '@/lib/db'
import type { PendingChange } from '@/lib/db/types'
import { updateListing } from '@/lib/db/queries/listings'

/** Single query replacing the N+1 pattern on the dashboard. */
export async function getActivePendingCountsByListings(
  listingIds: string[]
): Promise<Record<string, number>> {
  if (!listingIds.length) return {}
  const { rows } = await db.query<{ listing_id: string; count: string }>(
    `SELECT listing_id, COUNT(*) AS count
     FROM pending_changes
     WHERE status = 'pending'
       AND listing_id = ANY($1)
     GROUP BY listing_id`,
    [listingIds]
  )
  return Object.fromEntries(rows.map(r => [r.listing_id, parseInt(r.count, 10)]))
}

export async function createPendingChange(data: {
  listing_id: string
  seller_token_id: string | null
  change_type: PendingChange['change_type']
  change_data: Record<string, unknown>
}): Promise<PendingChange> {
  const { rows } = await sql<PendingChange>`
    INSERT INTO pending_changes (listing_id, seller_token_id, change_type, change_data)
    VALUES (
      ${data.listing_id},
      ${data.seller_token_id},
      ${data.change_type},
      ${JSON.stringify(data.change_data)}
    )
    RETURNING *
  `
  return rows[0]
}

export async function getPendingChangesByListing(listingId: string): Promise<PendingChange[]> {
  const { rows } = await sql<PendingChange>`
    SELECT * FROM pending_changes
    WHERE listing_id = ${listingId}
    ORDER BY created_at DESC
  `
  return rows
}

export async function reviewChange(
  id: string,
  status: 'approved' | 'rejected',
  agentNote?: string
): Promise<PendingChange | null> {
  const { rows } = await sql<PendingChange>`
    UPDATE pending_changes
    SET status = ${status},
        agent_note = ${agentNote ?? null},
        reviewed_at = now()
    WHERE id = ${id}
    RETURNING *
  `
  const change = rows[0]
  if (!change) return null

  if (status === 'approved') {
    await applyChange(change)
  }

  return change
}

function isHttpsUrl(val: unknown): val is string {
  if (typeof val !== 'string' || !val) return false
  try { return new URL(val).protocol === 'https:' } catch { return false }
}

async function applyChange(change: PendingChange): Promise<void> {
  const data = change.change_data as Record<string, unknown>

  if (change.change_type === 'price') {
    const price = typeof data.price === 'number' ? data.price : null
    const price_on_request = typeof data.price_on_request === 'boolean' ? data.price_on_request : false
    await updateListing(change.listing_id, { price, price_on_request })
  } else if (change.change_type === 'description') {
    const raw_description = typeof data.description === 'string' ? data.description : null
    await updateListing(change.listing_id, {
      raw_description,
      ...(raw_description ? { ai_story: raw_description } : {}),
    })
  } else if (change.change_type === 'images') {
    const raw_urls = Array.isArray(data.image_urls) ? (data.image_urls as unknown[]) : null
    const image_urls = raw_urls ? raw_urls.filter(isHttpsUrl) : null
    const hero_candidate = data.hero_image_url
    const hero_image_url = isHttpsUrl(hero_candidate) ? hero_candidate : undefined
    await updateListing(change.listing_id, {
      ...(image_urls !== null ? { image_urls } : {}),
      ...(hero_image_url !== undefined ? { hero_image_url } : {}),
    })
  }
}
