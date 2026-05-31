export interface Subscription {
  id: string
  agency_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: 'monthly' | 'yearly' | null
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'
  trial_ends_at: Date | null
  current_period_end: Date | null
  cancel_at_period_end: boolean
  manual_override: boolean
  created_at: Date
  updated_at: Date
}

export interface DiscountCode {
  id: string
  code: string
  discount_pct: number
  max_uses: number | null
  uses_count: number
  expires_at: Date | null
  active: boolean
  created_at: Date
}

export interface PersonalUser {
  id: string
  email: string | null
  name: string | null
  photo_url: string | null
  plan: 'free' | 'commercial'
  agency_id: string | null
  created_at: Date
}

export interface Agency {
  id: string
  slug: string
  name: string
  logo_url: string | null
  primary_color: string | null
  secondary_color: string | null
  contact_email: string | null
  contact_phone: string | null
  created_at: Date
}

export interface Agent {
  id: string
  agency_id: string
  name: string
  email: string
  phone: string | null
  photo_url: string | null
  role: 'admin' | 'agent'
  password_hash: string | null
  calendly_url: string | null
  invitation_token: string | null
  invitation_expires_at: Date | null
  created_at: Date
}

export interface Listing {
  id: string
  agency_id: string | null
  user_id: string | null
  agent_id: string | null
  slug: string
  status: 'active' | 'paused' | 'sold'

  title: string | null
  street: string | null
  city: string | null
  neighborhood: string | null
  price: number | null
  price_on_request: boolean
  built_area: number | null
  outdoor_area: number | null
  rooms: number | null

  floor: number | null
  total_floors: number | null
  parking_spots: number | null
  parking_covered: boolean | null
  has_storage: boolean | null
  has_saferoom: boolean | null
  has_elevator: boolean | null
  air_directions: string[] | null
  build_year: number | null
  renovation_year: number | null
  bathrooms: number | null

  raw_description: string | null
  ai_title: string | null
  ai_tagline: string | null
  ai_story: string | null
  ai_highlights: string[] | null

  hero_image_url: string | null
  image_urls: string[] | null
  video_url: string | null
  gallery_type: 'grid' | 'carousel-manual' | 'carousel-auto' | null
  carousel_speed: number | null

  show_map: boolean
  map_query_override: string | null

  template_id: string | null
  accent_color: string | null
  font_style: string | null
  section_order: string[] | null
  hidden_sections: string[] | null

  seller_name: string | null
  seller_phone: string | null
  seller_whatsapp: string | null

  open_house_date: Date | null
  open_house_end: Date | null

  created_at: Date
  updated_at: Date
}

export interface SellerToken {
  id: string
  listing_id: string
  token: string
  expires_at: Date
  created_at: Date
}

export interface PendingChange {
  id: string
  listing_id: string
  seller_token_id: string | null
  change_type: 'images' | 'price' | 'description'
  change_data: Record<string, unknown>
  status: 'pending' | 'approved' | 'rejected'
  agent_note: string | null
  created_at: Date
  reviewed_at: Date | null
}

export interface Lead {
  id: string
  listing_id: string
  agency_id: string
  name: string | null
  phone: string | null
  email: string | null
  source: 'booking' | 'open_house' | 'whatsapp' | 'direct'
  status: 'new' | 'contacted' | 'visited' | 'serious' | 'irrelevant' | 'offer_made' | 'closed'
  created_at: Date
  last_interaction: Date | null
}

export interface LeadNote {
  id: string
  lead_id: string
  agent_id: string | null
  note: string
  follow_up_at: Date | null
  follow_up_done: boolean
  created_at: Date
}

export interface OpenHouseRegistration {
  id: string
  listing_id: string
  name: string | null
  phone: string | null
  created_at: Date
}

export interface AnalyticsEvent {
  id: string
  listing_id: string | null
  agency_id: string | null
  event_type:
    | 'page_view'
    | 'whatsapp_click'
    | 'phone_click'
    | 'booking_click'
    | 'open_house_register'
    | 'wiki_question'
  referrer: string | null
  utm_source: string | null
  session_id: string | null
  created_at: Date
}
