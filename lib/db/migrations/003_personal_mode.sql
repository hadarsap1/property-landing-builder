-- Migration 003: Personal mode — private sellers alongside commercial agents
-- Run on existing databases that have migrations 001 + 002 applied.

-- Personal users (private sellers who sign in with Google or stay anonymous)
CREATE TABLE IF NOT EXISTS personal_users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text UNIQUE,
  name       text,
  photo_url  text,
  plan       text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'commercial')),
  agency_id  uuid REFERENCES agencies(id) ON DELETE SET NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personal_users_email    ON personal_users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_personal_users_agency   ON personal_users(agency_id) WHERE agency_id IS NOT NULL;

-- Make agency_id nullable on listings (personal listings have no agency)
ALTER TABLE listings
  ALTER COLUMN agency_id DROP NOT NULL;

-- Add user_id for personal listings
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES personal_users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);

-- Drop the old inline unique constraint (it would need recreating as partial anyway)
ALTER TABLE listings
  DROP CONSTRAINT IF EXISTS listings_agency_id_slug_key;

-- Partial unique indexes that work with NULLs correctly
CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_agency_slug
  ON listings(agency_id, slug) WHERE agency_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_user_slug
  ON listings(user_id, slug) WHERE user_id IS NOT NULL;
