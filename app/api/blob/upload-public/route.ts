import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getValidSellerToken } from '@/lib/db/queries/seller-tokens'

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

async function isTokenUploadRateLimited(tokenId: string): Promise<boolean> {
  if (!process.env.KV_URL) return false
  try {
    const { kv } = await import('@vercel/kv')
    const today = new Date().toISOString().slice(0, 10)
    const key = `rl:seller_uploads:${tokenId}:${today}`
    const count = await kv.incr(key)
    if (count === 1) await kv.expire(key, 86_400)
    return count > 20 // 20 uploads per seller token per day
  } catch {
    return false
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 })
  }

  const sellerToken = await getValidSellerToken(token)
  if (!sellerToken) {
    return NextResponse.json({ error: 'Token invalid or expired' }, { status: 401 })
  }

  if (await isTokenUploadRateLimited(sellerToken.id)) {
    return NextResponse.json({ error: 'הגעת למגבלה היומית להעלאת תמונות' }, { status: 429 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Blob storage not configured' }, { status: 503 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP and GIF are allowed' }, { status: 415 })
  }

  const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 413 })
  }

  const ext = MIME_EXT[file.type] ?? 'jpg'
  const pathname = `seller-uploads/${sellerToken.listing_id}/${Date.now()}.${ext}`

  const blob = await put(pathname, file, { access: 'public', contentType: file.type })

  return NextResponse.json({ url: blob.url }, { status: 201 })
}
