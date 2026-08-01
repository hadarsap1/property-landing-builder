import { sql } from '@/lib/db'

/**
 * Removing a listing or an account has to take its uploaded photos with it.
 *
 * The privacy policy promises "זכות מחיקה — לדרוש מחיקת חשבונך ונתוניך", and
 * the Protection of Privacy Law backs that up, but deletion only ever removed
 * database rows. Blob URLs are public and permanent, so photographs of
 * someone's home stayed reachable indefinitely after they deleted the account.
 */

/** Only touch blobs this app owns — never a URL a user typed in themselves. */
function isOwnedBlobUrl(url: string | null | undefined): url is string {
  if (typeof url !== 'string') return false
  try {
    const { protocol, hostname } = new URL(url)
    return protocol === 'https:' && hostname.endsWith('.public.blob.vercel-storage.com')
  } catch {
    return false
  }
}

/** Every stored image belonging to the given listings, de-duplicated. */
export async function collectListingMediaUrls(listingIds: string[]): Promise<string[]> {
  if (listingIds.length === 0) return []
  const { rows } = await sql<{
    hero_image_url: string | null
    image_urls: string[] | null
    floor_plan_url: string | null
  }>`
    SELECT hero_image_url, image_urls, floor_plan_url
    FROM listings
    WHERE id = ANY(${listingIds as unknown as string}::uuid[])
  `
  const urls = new Set<string>()
  for (const row of rows) {
    for (const u of [row.hero_image_url, row.floor_plan_url, ...(row.image_urls ?? [])]) {
      if (isOwnedBlobUrl(u)) urls.add(u)
    }
  }
  return [...urls]
}

/**
 * Best-effort blob removal. Deliberately never throws: the database rows are
 * already gone by this point, and failing the request would tell the user their
 * deletion did not work when the part they can see did.
 */
export async function deleteBlobs(urls: string[]): Promise<void> {
  if (urls.length === 0 || !process.env.BLOB_READ_WRITE_TOKEN) return
  try {
    const { del } = await import('@vercel/blob')
    await del(urls)
  } catch (err) {
    console.error('[media-cleanup] blob deletion failed:', err instanceof Error ? err.message : err)
  }
}

/** Collect a listing's media, run the caller's deletion, then purge the blobs. */
export async function withMediaCleanup<T>(
  listingIds: string[],
  deleteRows: () => Promise<T>
): Promise<T> {
  // Read the URLs first — after the rows go, they are unrecoverable.
  const urls = await collectListingMediaUrls(listingIds).catch(() => [] as string[])
  const result = await deleteRows()
  await deleteBlobs(urls)
  return result
}
