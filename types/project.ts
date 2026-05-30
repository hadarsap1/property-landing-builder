// Lifecycle status of a listing. Set to a terminal value ('sold' / 'rented')
// from the dashboard or the /manage page *after* the listing already exists —
// never during the first build. Drives the "no longer available" overlay.
export type PropertyStatus = 'available' | 'sold' | 'rented';

export interface PropertyProject {
  // Step 1
  listingType: 'sale' | 'rent';
  title: string;
  street: string;
  city: string;
  neighborhood: string;
  price: number | null;
  priceOnRequest: boolean;
  furniture: 'none' | 'partial' | 'full' | '';
  builtArea: number | null;
  gardenArea: number | null;
  rooms: number | null;

  // Step 2
  floor: number | null;
  totalFloors: number | null;
  parkingSpots: number | null;
  parkingType: 'covered' | 'outdoor' | '';
  hasStorage: boolean;
  hasSaferoom: boolean;
  hasElevator: boolean;
  airDirections: ('N' | 'S' | 'E' | 'W')[];
  buildYear: number | null;
  renovationYear: number | null;
  bathrooms: number | null;

  // Step 3
  rawStory: string;
  aiTitle: string;
  aiTagline: string;
  aiStory: string;
  aiHighlights: string[];

  // Step 4
  images: StoredImage[];
  heroImageIndex: number;
  galleryType: 'grid' | 'manual-carousel' | 'auto-3s' | 'auto-5s' | 'auto-7s';
  videoUrl: string;

  // Step 5
  showMap: boolean;
  mapQuery: string;

  // Step 6
  template: 'dark-luxury' | 'warm-homey' | 'modern-blue' | 'nature-space' | 'urban-bold';

  // Step 7
  accentColor: string;
  fontStyle: 'serif' | 'sans-serif' | 'display';
  sectionOrder: string[];
  sectionVisibility: Record<string, boolean>;

  // Step 7 – icon overrides (keys: rooms, builtArea, gardenArea, floor, bathrooms, parking, storage, saferoom, elevator, buildYear, renovationYear, airDirections)
  specIcons: Record<string, string>;

  // Step 8
  sellerName: string;
  phone: string;
  whatsapp: string;

  // Marketplace
  isPublished: boolean;

  // Lifecycle — defaults to 'available'; updated post-publish only
  status: PropertyStatus;
}

export interface StoredImage {
  id: string;
  dataUrl: string; // resized base64 (local/builder use; not stored in DB)
  enhancedDataUrl?: string; // AI-enhanced base64 — pre-save builder version
  blobUrl?: string; // Vercel Blob URL — used when project is saved server-side
  enhancedBlobUrl?: string; // AI-enhanced version (keeps original in blobUrl for undo)
  name: string;
}
