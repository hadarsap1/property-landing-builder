import { NextRequest, NextResponse } from 'next/server'
import { db } from '@vercel/postgres'

// One-click DB schema setup — run once after connecting a new Postgres database.
// Protected by SETUP_SECRET env var via Authorization header.
// Call: POST /api/admin/setup-db  with header  Authorization: Bearer YOUR_SECRET
export async function POST(req: NextRequest) {
  const secret = process.env.SETUP_SECRET
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!secret || bearer !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const statements = [
    `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,

    `CREATE TABLE IF NOT EXISTS agencies (
      id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      slug          text UNIQUE NOT NULL,
      name          text NOT NULL,
      logo_url      text,
      primary_color text,
      secondary_color text,
      contact_email text,
      contact_phone text,
      created_at    timestamp NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS personal_users (
      id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email      text UNIQUE,
      name       text,
      photo_url  text,
      plan       text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'commercial')),
      agency_id  uuid REFERENCES agencies(id) ON DELETE SET NULL,
      created_at timestamp NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS agents (
      id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      agency_id             uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
      name                  text NOT NULL,
      email                 text UNIQUE NOT NULL,
      phone                 text,
      photo_url             text,
      role                  text NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent')),
      password_hash         text,
      calendly_url          text,
      invitation_token      text UNIQUE,
      invitation_expires_at timestamp,
      created_at            timestamp NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS listings (
      id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      agency_id           uuid REFERENCES agencies(id) ON DELETE CASCADE,
      user_id             uuid REFERENCES personal_users(id) ON DELETE CASCADE,
      agent_id            uuid REFERENCES agents(id) ON DELETE SET NULL,
      slug                text NOT NULL,
      status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'sold')),
      listing_type        text NOT NULL DEFAULT 'sale' CHECK (listing_type IN ('sale', 'rent')),
      furniture           text CHECK (furniture IN ('none', 'partial', 'full')),
      title               text,
      street              text,
      city                text,
      neighborhood        text,
      price               integer,
      price_on_request    boolean NOT NULL DEFAULT false,
      built_area          integer,
      outdoor_area        integer,
      rooms               numeric,
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
      raw_description     text,
      ai_title            text,
      ai_tagline          text,
      ai_story            text,
      ai_highlights       text[],
      hero_image_url      text,
      image_urls          text[],
      video_url           text,
      gallery_type        text CHECK (gallery_type IN ('grid', 'carousel-manual', 'carousel-auto')),
      carousel_speed      integer,
      show_map            boolean NOT NULL DEFAULT true,
      map_query_override  text,
      template_id         text,
      accent_color        text,
      font_style          text,
      section_order       text[],
      hidden_sections     text[],
      seller_name         text,
      seller_phone        text,
      seller_whatsapp     text,
      open_house_date     timestamp,
      open_house_end      timestamp,
      created_at          timestamp NOT NULL DEFAULT now(),
      updated_at          timestamp NOT NULL DEFAULT now(),
      UNIQUE (agency_id, slug)
    )`,

    `CREATE OR REPLACE FUNCTION set_updated_at()
     RETURNS TRIGGER AS $$
     BEGIN NEW.updated_at = now(); RETURN NEW; END;
     $$ LANGUAGE plpgsql`,

    `DROP TRIGGER IF EXISTS listings_updated_at ON listings`,

    `CREATE TRIGGER listings_updated_at
     BEFORE UPDATE ON listings
     FOR EACH ROW EXECUTE FUNCTION set_updated_at()`,

    `CREATE TABLE IF NOT EXISTS subscriptions (
      id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      agency_id              uuid UNIQUE NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
      stripe_customer_id     text UNIQUE,
      stripe_subscription_id text UNIQUE,
      plan                   text CHECK (plan IN ('monthly', 'yearly')),
      status                 text NOT NULL DEFAULT 'trialing'
                               CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
      trial_ends_at          timestamp,
      current_period_end     timestamp,
      cancel_at_period_end   boolean NOT NULL DEFAULT false,
      manual_override        boolean NOT NULL DEFAULT false,
      created_at             timestamp NOT NULL DEFAULT now(),
      updated_at             timestamp NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS discount_codes (
      id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      code         text UNIQUE NOT NULL,
      discount_pct integer NOT NULL CHECK (discount_pct BETWEEN 1 AND 100),
      max_uses     integer,
      uses_count   integer NOT NULL DEFAULT 0,
      expires_at   timestamp,
      active       boolean NOT NULL DEFAULT true,
      created_at   timestamp NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS seller_tokens (
      id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      token      text UNIQUE NOT NULL,
      expires_at timestamp NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS pending_changes (
      id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id      uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      seller_token_id uuid REFERENCES seller_tokens(id) ON DELETE SET NULL,
      change_type     text NOT NULL CHECK (change_type IN ('images', 'price', 'description')),
      change_data     jsonb NOT NULL,
      status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      agent_note      text,
      created_at      timestamp NOT NULL DEFAULT now(),
      reviewed_at     timestamp
    )`,

    `CREATE TABLE IF NOT EXISTS leads (
      id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id       uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      agency_id        uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
      name             text,
      phone            text,
      email            text,
      source           text NOT NULL CHECK (source IN ('booking', 'open_house', 'whatsapp', 'direct')),
      status           text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'visited', 'serious', 'irrelevant', 'offer_made', 'closed')),
      created_at       timestamp NOT NULL DEFAULT now(),
      last_interaction timestamp
    )`,

    `CREATE TABLE IF NOT EXISTS lead_notes (
      id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id        uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      agent_id       uuid REFERENCES agents(id) ON DELETE SET NULL,
      note           text NOT NULL,
      follow_up_at   timestamp,
      follow_up_done boolean NOT NULL DEFAULT false,
      created_at     timestamp NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS open_house_registrations (
      id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      name       text,
      phone      text,
      created_at timestamp NOT NULL DEFAULT now()
    )`,

    `CREATE TABLE IF NOT EXISTS analytics_events (
      id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
      agency_id  uuid REFERENCES agencies(id) ON DELETE CASCADE,
      event_type text NOT NULL CHECK (event_type IN (
        'page_view', 'whatsapp_click', 'phone_click',
        'booking_click', 'open_house_register', 'wiki_question'
      )),
      referrer   text,
      utm_source text,
      session_id text,
      created_at timestamp NOT NULL DEFAULT now()
    )`,

    `CREATE INDEX IF NOT EXISTS idx_personal_users_email  ON personal_users(email) WHERE email IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_personal_users_agency ON personal_users(agency_id) WHERE agency_id IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_agents_agency_id      ON agents(agency_id)`,
    `CREATE INDEX IF NOT EXISTS idx_listings_agency_id    ON listings(agency_id)`,
    `CREATE INDEX IF NOT EXISTS idx_listings_user_id      ON listings(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_listings_agent_id     ON listings(agent_id)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_agency_slug ON listings(agency_id, slug) WHERE agency_id IS NOT NULL`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_user_slug   ON listings(user_id, slug)   WHERE user_id  IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_listings_status        ON listings(status)`,
    `CREATE INDEX IF NOT EXISTS idx_seller_tokens_listing  ON seller_tokens(listing_id)`,
    `CREATE INDEX IF NOT EXISTS idx_seller_tokens_expires  ON seller_tokens(expires_at)`,
    `CREATE INDEX IF NOT EXISTS idx_pending_changes_listing ON pending_changes(listing_id)`,
    `CREATE INDEX IF NOT EXISTS idx_pending_changes_status  ON pending_changes(status)`,
    `CREATE INDEX IF NOT EXISTS idx_leads_listing_id       ON leads(listing_id)`,
    `CREATE INDEX IF NOT EXISTS idx_leads_agency_id        ON leads(agency_id)`,
    `CREATE INDEX IF NOT EXISTS idx_leads_status           ON leads(status)`,
    `CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id     ON lead_notes(lead_id)`,
    `CREATE INDEX IF NOT EXISTS idx_lead_notes_followup    ON lead_notes(follow_up_at) WHERE follow_up_done = false`,
    `CREATE INDEX IF NOT EXISTS idx_open_house_listing     ON open_house_registrations(listing_id)`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_listing      ON analytics_events(listing_id)`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_agency       ON analytics_events(agency_id)`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_created      ON analytics_events(created_at)`,
  ]

  const client = await db.connect()
  const results: { sql: string; ok: boolean; error?: string }[] = []

  try {
    for (const stmt of statements) {
      const preview = stmt.slice(0, 60).replace(/\s+/g, ' ')
      try {
        await client.query(stmt)
        results.push({ sql: preview, ok: true })
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        results.push({ sql: preview, ok: false, error: msg })
      }
    }
  } finally {
    client.release()
  }

  const failed = results.filter((r) => !r.ok)
  return NextResponse.json({
    ok: failed.length === 0,
    total: results.length,
    failed: failed.length,
    results,
  })
}
