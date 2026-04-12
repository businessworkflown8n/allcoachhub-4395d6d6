
-- Add new columns to landing_pages
ALTER TABLE public.landing_pages
  ADD COLUMN IF NOT EXISTS badge_text text DEFAULT '🔥 Limited Slots Available',
  ADD COLUMN IF NOT EXISTS cta_type text DEFAULT 'form',
  ADD COLUMN IF NOT EXISTS cta_link text,
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

-- Create landing_page_features table
CREATE TABLE IF NOT EXISTS public.landing_page_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id uuid NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  icon text DEFAULT 'Star',
  title text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.landing_page_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users manage features" ON public.landing_page_features FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public view active features" ON public.landing_page_features FOR SELECT TO anon USING (is_active = true);

-- Create CTA click tracking table
CREATE TABLE IF NOT EXISTS public.landing_page_cta_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id uuid NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  cta_type text NOT NULL DEFAULT 'form',
  clicked_at timestamptz DEFAULT now()
);

ALTER TABLE public.landing_page_cta_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert clicks" ON public.landing_page_cta_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Auth users view clicks" ON public.landing_page_cta_clicks FOR SELECT TO authenticated USING (true);

-- Add source to leads if not exists
ALTER TABLE public.landing_page_leads ADD COLUMN IF NOT EXISTS source text DEFAULT 'direct';

-- Trigger for updated_at on features
CREATE TRIGGER update_landing_page_features_updated_at
  BEFORE UPDATE ON public.landing_page_features
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
