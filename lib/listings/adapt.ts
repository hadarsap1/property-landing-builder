import type { PropertyProject, StoredImage } from '@/types/project'
import type { Listing } from '@/lib/db/types'

function galleryTypeToProject(
  dbType: Listing['gallery_type'],
  speed: number | null
): PropertyProject['galleryType'] {
  if (dbType === 'carousel-manual') return 'manual-carousel'
  if (dbType === 'carousel-auto') {
    if (speed === 3) return 'auto-3s'
    if (speed === 7) return 'auto-7s'
    return 'auto-5s'
  }
  return 'grid'
}

function galleryTypeToDb(
  pt: PropertyProject['galleryType']
): { gallery_type: Listing['gallery_type']; carousel_speed: number | null } {
  switch (pt) {
    case 'manual-carousel': return { gallery_type: 'carousel-manual', carousel_speed: null }
    case 'auto-3s': return { gallery_type: 'carousel-auto', carousel_speed: 3 }
    case 'auto-5s': return { gallery_type: 'carousel-auto', carousel_speed: 5 }
    case 'auto-7s': return { gallery_type: 'carousel-auto', carousel_speed: 7 }
    default: return { gallery_type: 'grid', carousel_speed: null }
  }
}

const ALL_SECTIONS = ['hero', 'story', 'specs', 'gallery', 'map', 'contact'] as const

/** Convert a DB Listing row into the PropertyProject shape the wizard/preview expects. */
export function listingToProject(listing: Listing): PropertyProject {
  const urls = listing.image_urls ?? []
  const images: StoredImage[] = urls.map((url, i) => ({
    id: String(i),
    dataUrl: url,
    name: `image-${i}`,
  }))

  const heroIdx = listing.hero_image_url
    ? Math.max(0, urls.indexOf(listing.hero_image_url))
    : 0

  const hidden = new Set(listing.hidden_sections ?? [])
  const sectionVisibility: Record<string, boolean> = Object.fromEntries(
    ALL_SECTIONS.map((s) => [s, !hidden.has(s)])
  )

  const parkingType =
    listing.parking_covered === true
      ? 'covered'
      : listing.parking_covered === false
        ? 'outdoor'
        : ''

  return {
    listingType: (listing.listing_type ?? 'sale') as PropertyProject['listingType'],
    title: listing.title ?? '',
    street: listing.street ?? '',
    city: listing.city ?? '',
    neighborhood: listing.neighborhood ?? '',
    price: listing.price ?? null,
    priceOnRequest: listing.price_on_request,
    furniture: (listing.furniture ?? '') as PropertyProject['furniture'],
    builtArea: listing.built_area ?? null,
    gardenArea: listing.outdoor_area ?? null,
    rooms: listing.rooms ?? null,

    floor: listing.floor ?? null,
    totalFloors: listing.total_floors ?? null,
    parkingSpots: listing.parking_spots ?? null,
    parkingType: parkingType as PropertyProject['parkingType'],
    hasStorage: listing.has_storage ?? false,
    hasSaferoom: listing.has_saferoom ?? false,
    hasElevator: listing.has_elevator ?? false,
    airDirections: (listing.air_directions ?? []) as PropertyProject['airDirections'],
    buildYear: listing.build_year ?? null,
    renovationYear: listing.renovation_year ?? null,
    bathrooms: listing.bathrooms ?? null,

    rawStory: listing.raw_description ?? '',
    aiTitle: listing.ai_title ?? '',
    aiTagline: listing.ai_tagline ?? '',
    aiStory: listing.ai_story ?? '',
    aiHighlights: listing.ai_highlights ?? [],

    images,
    heroImageIndex: heroIdx,
    galleryType: galleryTypeToProject(listing.gallery_type, listing.carousel_speed),
    videoUrl: listing.video_url ?? '',

    showMap: listing.show_map,
    mapQuery: listing.map_query_override ?? '',

    template: (listing.template_id as PropertyProject['template']) ?? 'modern-blue',

    accentColor: listing.accent_color ?? '#2563eb',
    fontStyle: (listing.font_style as PropertyProject['fontStyle']) ?? 'sans-serif',
    sectionOrder: listing.section_order ?? [...ALL_SECTIONS],
    sectionVisibility,

    specIcons: {},

    sellerName: listing.seller_name ?? '',
    phone: listing.seller_phone ?? '',
    whatsapp: listing.seller_whatsapp ?? '',
  }
}

/** Convert a PropertyProject into the Listing DB update fields (excludes media — handled by Blob API). */
export function projectToListingData(
  project: PropertyProject
): Record<string, string | number | boolean | string[] | null> {
  const { gallery_type, carousel_speed } = galleryTypeToDb(project.galleryType)

  const hidden_sections = ALL_SECTIONS.filter((s) => !project.sectionVisibility[s])

  const parking_covered =
    project.parkingType === 'covered'
      ? true
      : project.parkingType === 'outdoor'
        ? false
        : null

  return {
    listing_type: project.listingType,
    furniture: project.furniture || null,
    title: project.title || null,
    street: project.street || null,
    city: project.city || null,
    neighborhood: project.neighborhood || null,
    price: project.price,
    price_on_request: project.priceOnRequest,
    built_area: project.builtArea,
    outdoor_area: project.gardenArea,
    rooms: project.rooms,
    floor: project.floor,
    total_floors: project.totalFloors,
    parking_spots: project.parkingSpots,
    parking_covered,
    has_storage: project.hasStorage,
    has_saferoom: project.hasSaferoom,
    has_elevator: project.hasElevator,
    air_directions: project.airDirections,
    build_year: project.buildYear,
    renovation_year: project.renovationYear,
    bathrooms: project.bathrooms,
    raw_description: project.rawStory || null,
    ai_title: project.aiTitle || null,
    ai_tagline: project.aiTagline || null,
    ai_story: project.aiStory || null,
    ai_highlights: project.aiHighlights,
    video_url: project.videoUrl || null,
    gallery_type,
    carousel_speed,
    show_map: project.showMap,
    map_query_override: project.mapQuery || null,
    template_id: project.template,
    accent_color: project.accentColor || null,
    font_style: project.fontStyle,
    section_order: project.sectionOrder,
    hidden_sections,
    seller_name: project.sellerName || null,
    seller_phone: project.phone || null,
    seller_whatsapp: project.whatsapp || null,
  }
}
