-- Enable uuid generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Agencies (one per real estate company)
CREATE TABLE IF NOT EXISTS agencies (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  name          text NOT NULL,
  logo_url      text,
  primary_color text,
  secondary_color text,
  contact_email text,
  contact_phone text,
  created_at    timestamp NOT NULL DEFAULT now()
);

-- Agents (employees of an agency)
CREATE TABLE IF NOT EXISTS agents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name          text NOT NULL,
  email         text UNIQUE NOT NULL,
  phone         text,
  photo_url     text,
  role                   text NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent')),
  password_hash          text,
  calendly_url           text,
  invitation_token       text UNIQUE,
  invitation_expires_at  timestamp,
  created_at             timestamp NOT NULL DEFAULT now()
);

-- Listings (properties)
CREATE TABLE IF NOT EXISTS listings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id           uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  agent_id            uuid REFERENCES agents(id) ON DELETE SET NULL,
  slug                text NOT NULL,
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'sold')),

  -- Step 1: Basic Info
  title               text,
  street              text,
  city                text,
  neighborhood        text,
  price               integer,
  price_on_request    boolean NOT NULL DEFAULT false,
  built_area          integer,
  outdoor_area        integer,
  rooms               numeric,

  -- Step 2: Specs
  floor               integer,
  total_floors        integer,
  parking_spots       integer,
  parking_covered     boolean,
  has_storage         boolean,
  has_saferoom        boolean,
  has_elevator        boolean,
  air_directions      text[],
  build_year          integer,
  renovation_year     integer,
  bathrooms           integer,

  -- Step 3: AI Content
  raw_description     text,
  ai_title            text,
  ai_tagline          text,
  ai_story            text,
  ai_highlights       text[],

  -- Step 4: Media
  hero_image_url      text,
  image_urls          text[],
  video_url           text,
  gallery_type        text CHECK (gallery_type IN ('grid', 'carousel-manual', 'carousel-auto')),
  carousel_speed      integer,

  -- Step 5: Map
  show_map            boolean NOT NULL DEFAULT true,
  map_query_override  text,

  -- Step 6-7: Design
  template_id         text,
  accent_color        text,
  font_style          text,
  section_order       text[],
  hidden_sections     text[],

  -- Step 8: Contact
  seller_name         text,
  seller_phone        text,
  seller_whatsapp     text,

  -- Open House
  open_house_date     timestamp,
  open_house_end      timestamp,

  created_at          timestamp NOT NULL DEFAULT now(),
  updated_at          timestamp NOT NULL DEFAULT now(),

  UNIQUE (agency_id, slug)
);

-- Auto-update updated_at on listings
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seller access (magic link tokens)
CREATE TABLE IF NOT EXISTS seller_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  token       text UNIQUE NOT NULL,
  expires_at  timestamp NOT NULL,
  created_at  timestamp NOT NULL DEFAULT now()
);

-- Pending changes from sellers awaiting agent approval
CREATE TABLE IF NOT EXISTS pending_changes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id       uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  seller_token_id  uuid REFERENCES seller_tokens(id) ON DELETE SET NULL,
  change_type      text NOT NULL CHECK (change_type IN ('images', 'price', 'description')),
  change_data      jsonb NOT NULL,
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  agent_note       text,
  created_at       timestamp NOT NULL DEFAULT now(),
  reviewed_at      timestamp
);

-- Leads (interested visitors)
CREATE TABLE IF NOT EXISTS leads (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id        uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  agency_id         uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name              text,
  phone             text,
  email             text,
  source            text NOT NULL CHECK (source IN ('booking', 'open_house', 'whatsapp', 'direct')),
  status            text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'visited', 'serious', 'irrelevant', 'offer_made', 'closed')),
  created_at        timestamp NOT NULL DEFAULT now(),
  last_interaction  timestamp
);

-- Lead notes and follow-ups
CREATE TABLE IF NOT EXISTS lead_notes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id        uuid REFERENCES agents(id) ON DELETE SET NULL,
  note            text NOT NULL,
  follow_up_at    timestamp,
  follow_up_done  boolean NOT NULL DEFAULT false,
  created_at      timestamp NOT NULL DEFAULT now()
);

-- Open house registrations
CREATE TABLE IF NOT EXISTS open_house_registrations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  name        text,
  phone       text,
  created_at  timestamp NOT NULL DEFAULT now()
);

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  uuid REFERENCES listings(id) ON DELETE CASCADE,
  agency_id   uuid REFERENCES agencies(id) ON DELETE CASCADE,
  event_type  text NOT NULL CHECK (event_type IN (
    'page_view', 'whatsapp_click', 'phone_click',
    'booking_click', 'open_house_register', 'wiki_question'
  )),
  referrer    text,
  utm_source  text,
  session_id  text,
  created_at  timestamp NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_agents_agency_id        ON agents(agency_id);
CREATE INDEX IF NOT EXISTS idx_listings_agency_id      ON listings(agency_id);
CREATE INDEX IF NOT EXISTS idx_listings_agent_id       ON listings(agent_id);
CREATE INDEX IF NOT EXISTS idx_listings_status         ON listings(status);
CREATE INDEX IF NOT EXISTS idx_seller_tokens_listing   ON seller_tokens(listing_id);
CREATE INDEX IF NOT EXISTS idx_seller_tokens_expires   ON seller_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_pending_changes_listing ON pending_changes(listing_id);
CREATE INDEX IF NOT EXISTS idx_pending_changes_status  ON pending_changes(status);
CREATE INDEX IF NOT EXISTS idx_leads_listing_id        ON leads(listing_id);
CREATE INDEX IF NOT EXISTS idx_leads_agency_id         ON leads(agency_id);
CREATE INDEX IF NOT EXISTS idx_leads_status            ON leads(status);
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id      ON lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_followup     ON lead_notes(follow_up_at) WHERE follow_up_done = false;
CREATE INDEX IF NOT EXISTS idx_open_house_listing      ON open_house_registrations(listing_id);
CREATE INDEX IF NOT EXISTS idx_analytics_listing       ON analytics_events(listing_id);
CREATE INDEX IF NOT EXISTS idx_analytics_agency        ON analytics_events(agency_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created       ON analytics_events(created_at);
