
-- Add missing CTA columns
ALTER TABLE public.landing_pages
  ADD COLUMN IF NOT EXISTS cta_text text,
  ADD COLUMN IF NOT EXISTS cta_type text DEFAULT 'form',
  ADD COLUMN IF NOT EXISTS cta_link text;

-- Also ensure other columns from previous migration exist
ALTER TABLE public.landing_pages
  ADD COLUMN IF NOT EXISTS badge_text text DEFAULT '🔥 Limited Slots Available',
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS whatsapp_message text DEFAULT 'Hi, I am interested in coaching on your platform.',
  ADD COLUMN IF NOT EXISTS email_address text,
  ADD COLUMN IF NOT EXISTS floating_cta_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS floating_cta_position text DEFAULT 'bottom-right',
  ADD COLUMN IF NOT EXISTS floating_cta_type text DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS floating_cta_animation text DEFAULT 'pulse',
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS schema_markup jsonb;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
