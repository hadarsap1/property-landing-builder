import { sql } from '@/lib/db'
import type { DiscountCode } from '@/lib/db/types'

export async function validateDiscountCode(
  code: string
): Promise<DiscountCode | null> {
  const { rows } = await sql<DiscountCode>`
    SELECT * FROM discount_codes
    WHERE code = ${code.toUpperCase()}
      AND active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND (max_uses IS NULL OR uses_count < max_uses)
    LIMIT 1
  `
  return rows[0] ?? null
}

export async function incrementDiscountUsage(id: string): Promise<void> {
  await sql`
    UPDATE discount_codes SET uses_count = uses_count + 1 WHERE id = ${id}
  `
}

export async function createDiscountCode(data: {
  code: string
  discount_pct: number
  max_uses?: number | null
  expires_at?: Date | null
}): Promise<DiscountCode> {
  const { rows } = await sql<DiscountCode>`
    INSERT INTO discount_codes (code, discount_pct, max_uses, expires_at)
    VALUES (
      ${data.code.toUpperCase()},
      ${data.discount_pct},
      ${data.max_uses ?? null},
      ${data.expires_at?.toISOString() ?? null}
    )
    RETURNING *
  `
  return rows[0]
}

export async function getAllDiscountCodes(): Promise<DiscountCode[]> {
  const { rows } = await sql<DiscountCode>`
    SELECT * FROM discount_codes ORDER BY created_at DESC
  `
  return rows
}

export async function toggleDiscountCode(
  id: string,
  active: boolean
): Promise<void> {
  await sql`UPDATE discount_codes SET active = ${active} WHERE id = ${id}`
}

export async function deleteDiscountCode(id: string): Promise<void> {
  await sql`DELETE FROM discount_codes WHERE id = ${id}`
}
