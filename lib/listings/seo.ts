import type { Listing } from '@/lib/db/types'
import type { Agency } from '@/lib/db/types'

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? 'property-landing-builder.vercel.app'

/** Canonical public URL for a listing on its agency subdomain. */
export function listingCanonicalUrl(agencySlug: string, listingSlug: string): string {
  return `https://${agencySlug}.${ROOT_DOMAIN}/listings/${listingSlug}`
}

/**
 * schema.org RealEstateListing JSON-LD for Google rich results.
 * https://developers.google.com/search/docs/appearance/structured-data
 */
export function listingJsonLd(listing: Listing, agency: Agency | null, canonicalUrl: string) {
  const title = listing.ai_title || listing.title || 'נכס למכירה'
  const description =
    listing.ai_tagline ||
    listing.ai_story?.slice(0, 200) ||
    [listing.rooms && `${listing.rooms} חדרים`, listing.city].filter(Boolean).join(', ')

  const images = [
    ...(listing.hero_image_url ? [listing.hero_image_url] : []),
    ...(listing.image_urls ?? []).filter((u) => u !== listing.hero_image_url),
  ].slice(0, 8)

  const accommodation: Record<string, unknown> = {
    '@type': 'Apartment',
    name: title,
    address: {
      '@type': 'PostalAddress',
      ...(listing.street ? { streetAddress: listing.street } : {}),
      ...(listing.city ? { addressLocality: listing.city } : {}),
      addressCountry: 'IL',
    },
  }
  if (listing.rooms) accommodation.numberOfRooms = Number(listing.rooms)
  if (listing.bathrooms) accommodation.numberOfBathroomsTotal = listing.bathrooms
  if (listing.built_area) {
    accommodation.floorSize = {
      '@type': 'QuantitativeValue',
      value: listing.built_area,
      unitCode: 'MTK', // square metres
    }
  }
  if (listing.build_year) accommodation.yearBuilt = listing.build_year

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: title,
    ...(description ? { description } : {}),
    url: canonicalUrl,
    ...(images.length ? { image: images } : {}),
    datePosted: new Date(listing.created_at).toISOString(),
    about: accommodation,
    ...(agency
      ? {
          provider: {
            '@type': 'RealEstateAgent',
            name: agency.name,
            ...(agency.logo_url ? { logo: agency.logo_url } : {}),
            ...(agency.contact_phone ? { telephone: agency.contact_phone } : {}),
          },
        }
      : {}),
  }

  if (!listing.price_on_request && listing.price) {
    jsonLd.offers = {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: 'ILS',
      availability: 'https://schema.org/InStock',
      ...(listing.listing_type === 'rent'
        ? { businessFunction: 'http://purl.org/goodrelations/v1#LeaseOut' }
        : { businessFunction: 'http://purl.org/goodrelations/v1#Sell' }),
    }
  }

  return jsonLd
}
