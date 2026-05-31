import { NextRequest, NextResponse } from 'next/server'
import { getValidSellerToken } from '@/lib/db/queries/seller-tokens'
import { createPendingChange } from '@/lib/db/queries/pending-changes'
import type { PendingChange } from '@/lib/db/types'

type RouteContext = { params: Promise<{ token: string }> }

async function isTokenRateLimited(tokenId: string): Promise<boolean> {
  if (!process.env.KV_URL) return false
  try {
    const { kv } = await import('@vercel/kv')
    const today = new Date().toISOString().slice(0, 10)
    const key = `rl:seller_changes:${tokenId}:${today}`
    const count = await kv.incr(key)
    if (count === 1) await kv.expire(key, 86_400)
    return count > 10 // 10 change submissions per seller token per day
  } catch {
    return false
  }
}

export async function POST(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { token } = await params
  const sellerToken = await getValidSellerToken(token)
  if (!sellerToken) {
    return NextResponse.json({ error: 'Token invalid or expired' }, { status: 401 })
  }

  if (await isTokenRateLimited(sellerToken.id)) {
    return NextResponse.json({ error: 'הגעת למגבלה היומית לשליחת שינויים' }, { status: 429 })
  }

  const body = (await req.json()) as {
    change_type?: string
    change_data?: Record<string, unknown>
  }

  const validTypes: PendingChange['change_type'][] = ['images', 'price', 'description']
  if (!body.change_type || !validTypes.includes(body.change_type as PendingChange['change_type'])) {
    return NextResponse.json({ error: 'Invalid change_type' }, { status: 400 })
  }
  if (!body.change_data || typeof body.change_data !== 'object') {
    return NextResponse.json({ error: 'Missing change_data' }, { status: 400 })
  }

  const change = await createPendingChange({
    listing_id: sellerToken.listing_id,
    seller_token_id: sellerToken.id,
    change_type: body.change_type as PendingChange['change_type'],
    change_data: body.change_data,
  })

  return NextResponse.json({ change }, { status: 201 })
}
