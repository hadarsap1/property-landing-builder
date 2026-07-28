-- Two pieces of builder work had nowhere to be stored, so they were silently
-- dropped every time the owner reloaded: the per-spec icon overrides chosen in
-- step 7, and the floor plan uploaded in step 4.
ALTER TABLE listings ADD COLUMN IF NOT EXISTS spec_icons     jsonb;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS floor_plan_url text;
