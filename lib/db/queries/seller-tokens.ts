import { sql } from '@/lib/db'
import type { SellerToken, Listing } from '@/lib/db/types'
import { getListingById } from '@/lib/db/queries/listings'

export async function createSellerToken(listingId: string): Promise<SellerToken> {
  const token = crypto.randomUUID()
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  const { rows } = await sql<SellerToken>`
    INSERT INTO seller_tokens (listing_id, token, expires_at)
    VALUES (${listingId}, ${token}, ${expires_at.toISOString()})
    RETURNING *
  `
  return rows[0]
}

export async function getValidSellerToken(token: string): Promise<SellerToken | null> {
  const { rows } = await sql<SellerToken>`
    SELECT * FROM seller_tokens
    WHERE token = ${token}
      AND expires_at > now()
    LIMIT 1
  `
  return rows[0] ?? null
}

export async function getSellerTokenWithListing(
  token: string
): Promise<{ sellerToken: SellerToken; listing: Listing } | null> {
  const sellerToken = await getValidSellerToken(token)
  if (!sellerToken) return null
  const listing = await getListingById(sellerToken.listing_id)
  if (!listing) return null
  return { sellerToken, listing }
}
