import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getValidSellerToken } from '@/lib/db/queries/seller-tokens'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 })
  }

  const sellerToken = await getValidSellerToken(token)
  if (!sellerToken) {
    return NextResponse.json({ error: 'Token invalid or expired' }, { status: 401 })
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

  const ext = file.name.split('.').pop() ?? 'jpg'
  const pathname = `seller-uploads/${sellerToken.listing_id}/${Date.now()}.${ext}`

  const blob = await put(pathname, file, { access: 'public', contentType: file.type })

  return NextResponse.json({ url: blob.url }, { status: 201 })
}
