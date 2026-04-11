
-- Add new columns to existing landing_pages table
ALTER TABLE public.landing_pages
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS headline TEXT,
  ADD COLUMN IF NOT EXISTS subheadline TEXT,
  ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS how_it_works JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS trust_points JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
  ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#84cc16',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Make coach_id nullable for admin-created pages
ALTER TABLE public.landing_pages ALTER COLUMN coach_id DROP NOT NULL;

-- Create landing_page_leads table
CREATE TABLE public.landing_page_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  landing_page_id UUID NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  years_of_expertise INTEGER,
  city TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.landing_page_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit leads"
  ON public.landing_page_leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all leads"
  ON public.landing_page_leads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update leads"
  ON public.landing_page_leads FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete leads"
  ON public.landing_page_leads FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_landing_page_leads_updated_at
  BEFORE UPDATE ON public.landing_page_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SEO auto-detect trigger for landing pages
CREATE OR REPLACE FUNCTION public.seo_auto_detect_landing_page()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_page_url text;
BEGIN
  IF NEW.status = 'published' OR NEW.is_published = true THEN
    v_page_url := '/lp/' || NEW.slug;
    INSERT INTO public.seo_page_metadata (page_url, page_type, meta_title, meta_description, h1_tag, primary_keyword, robots_directive, canonical_url, index_status, is_auto_generated, page_title, sitemap_included)
    VALUES (
      v_page_url, 'landing_page',
      LEFT(COALESCE(NEW.meta_title, NEW.headline, NEW.title) || ' | AI Coach Portal', 70),
      LEFT(COALESCE(NEW.meta_description, NEW.subheadline, ''), 160),
      COALESCE(NEW.headline, NEW.title), LOWER(COALESCE(NEW.category, '')), 'index, follow',
      'https://www.aicoachportal.com' || v_page_url,
      'pending', true, COALESCE(NEW.headline, NEW.title), true
    )
    ON CONFLICT (page_url) DO UPDATE SET
      meta_title = EXCLUDED.meta_title,
      meta_description = EXCLUDED.meta_description,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER seo_auto_detect_landing_page_trigger
  AFTER INSERT OR UPDATE ON public.landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.seo_auto_detect_landing_page();

-- Indexes
CREATE INDEX idx_landing_page_leads_page_id ON public.landing_page_leads(landing_page_id);
CREATE INDEX idx_landing_page_leads_status ON public.landing_page_leads(status);
CREATE INDEX idx_landing_pages_status ON public.landing_pages(status);
CREATE INDEX idx_landing_pages_category ON public.landing_pages(category);
