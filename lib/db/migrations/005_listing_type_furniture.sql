ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS listing_type text NOT NULL DEFAULT 'sale'
    CHECK (listing_type IN ('sale', 'rent')),
  ADD COLUMN IF NOT EXISTS furniture text
    CHECK (furniture IN ('none', 'partial', 'full'));
