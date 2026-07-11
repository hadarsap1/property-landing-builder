-- Track listings that were paused automatically when the agency's
-- subscription was canceled, so they can be restored on resubscribe
-- without touching listings the broker paused deliberately.
ALTER TABLE listings ADD COLUMN IF NOT EXISTS auto_paused boolean NOT NULL DEFAULT false;
