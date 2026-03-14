
-- Add social media URL columns to materials
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS twitter_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS tiktok_url text,
  ADD COLUMN IF NOT EXISTS linkedin_clicks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS facebook_clicks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS instagram_clicks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS twitter_clicks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS youtube_clicks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tiktok_clicks integer NOT NULL DEFAULT 0;
