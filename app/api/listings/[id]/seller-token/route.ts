import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getListingById } from '@/lib/db/queries/listings'
import { createSellerToken } from '@/lib/db/queries/seller-tokens'
import { sendSellerMagicLinkEmail } from '@/lib/email'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.agencyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const listing = await getListingById(id)
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (listing.agency_id !== session.user.agencyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const sellerToken = await createSellerToken(id)

  const rootDomain = process.env.ROOT_DOMAIN ?? 'localhost:3000'
  const protocol = rootDomain.startsWith('localhost') ? 'http' : 'https'
  const sellerUrl = `${protocol}://${rootDomain}/seller/${sellerToken.token}`

  // Optionally email the seller if we have their contact
  let body: { email?: string } = {}
  try { body = (await req.json()) as typeof body } catch { /* optional body */ }

  const toEmail = body.email ?? null
  if (toEmail) {
    const listingTitle = listing.ai_title ?? listing.title ?? 'נכס'
    await sendSellerMagicLinkEmail({
      to: toEmail,
      sellerName: listing.seller_name,
      listingTitle,
      sellerUrl,
    })
  }

  return NextResponse.json({ sellerUrl, token: sellerToken.token })
}
