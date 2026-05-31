import { NextRequest, NextResponse } from 'next/server'
import { getSellerTokenWithListing } from '@/lib/db/queries/seller-tokens'

type RouteContext = { params: Promise<{ token: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { token } = await params
  const result = await getSellerTokenWithListing(token)
  if (!result) {
    return NextResponse.json({ error: 'Token invalid or expired' }, { status: 404 })
  }

  const { listing } = result
  // Return only fields the seller needs to see/edit
  return NextResponse.json({
    listing: {
      id: listing.id,
      title: listing.ai_title ?? listing.title,
      street: listing.street,
      city: listing.city,
      price: listing.price,
      price_on_request: listing.price_on_request,
      raw_description: listing.raw_description,
      ai_story: listing.ai_story,
      hero_image_url: listing.hero_image_url,
      image_urls: listing.image_urls,
      rooms: listing.rooms,
      built_area: listing.built_area,
    },
  })
}
