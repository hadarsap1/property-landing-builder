-- Property Landing Builder — PostgreSQL schema
-- Run this once against your Neon database to initialise the tables.
-- Safe to re-run: uses CREATE TABLE IF NOT EXISTS.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- for gen_random_uuid()

-- ── Users ────────────────────────────────────────────────────────────────────
-- Populated on first Google sign-in via Auth.js.
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  name       TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Projects ─────────────────────────────────────────────────────────────────
-- user_id is nullable so anonymous sessions still work (same 6-digit code UX).
-- expires_at is null for logged-in users (permanent), set for anonymous ones.
CREATE TABLE IF NOT EXISTS projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            CHAR(6) UNIQUE NOT NULL,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  title           TEXT,
  city            TEXT,
  neighborhood    TEXT,
  rooms           NUMERIC,
  price           BIGINT,
  price_on_request BOOLEAN NOT NULL DEFAULT false,
  template        TEXT,
  is_published    BOOLEAN NOT NULL DEFAULT false,
  data            JSONB NOT NULL,           -- full PropertyProject (images as blob URLs)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ               -- null = permanent
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id     ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_is_published ON projects(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_projects_city         ON projects(city) WHERE is_published = true;

-- ── Analytics Events ─────────────────────────────────────────────────────────
-- Replaces the Vercel KV analytics:events list.
CREATE TABLE IF NOT EXISTS analytics_events (
  id           BIGSERIAL PRIMARY KEY,
  session_id   TEXT NOT NULL,
  project_code CHAR(6),
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  event        TEXT NOT NULL,
  step         INT,
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_session_id   ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_project_code ON analytics_events(project_code);
CREATE INDEX IF NOT EXISTS idx_events_created_at   ON analytics_events(created_at);

-- ── Project Views ─────────────────────────────────────────────────────────────
-- Tracks buyer-side engagement on published preview pages.
CREATE TABLE IF NOT EXISTS project_views (
  id                 BIGSERIAL PRIMARY KEY,
  project_code       CHAR(6) NOT NULL,
  viewer_session_id  TEXT NOT NULL,
  referrer           TEXT,
  contact_clicked    BOOLEAN NOT NULL DEFAULT false,
  whatsapp_clicked   BOOLEAN NOT NULL DEFAULT false,
  duration_seconds   INT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_views_unique
  ON project_views(project_code, viewer_session_id);

CREATE INDEX IF NOT EXISTS idx_views_project_code ON project_views(project_code);
CREATE INDEX IF NOT EXISTS idx_views_created_at   ON project_views(created_at);
