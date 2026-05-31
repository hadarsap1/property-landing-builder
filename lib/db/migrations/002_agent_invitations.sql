-- Migration 002: invitation token support on agents
-- Run this on existing databases that already have the Phase 1 schema applied.

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS invitation_token      text UNIQUE,
  ADD COLUMN IF NOT EXISTS invitation_expires_at timestamp;

CREATE INDEX IF NOT EXISTS idx_agents_invitation_token
  ON agents(invitation_token)
  WHERE invitation_token IS NOT NULL;
