
-- Add slug column to profiles for coach landing page URLs
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Create function to generate profile slug from full_name
CREATE OR REPLACE FUNCTION public.generate_profile_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  base_slug text;
  new_slug text;
  counter integer := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug != '' THEN
    RETURN NEW;
  END IF;
  IF NEW.full_name IS NULL OR NEW.full_name = '' THEN
    RETURN NEW;
  END IF;
  base_slug := lower(regexp_replace(regexp_replace(NEW.full_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  base_slug := left(base_slug, 80);
  new_slug := base_slug;
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE slug = new_slug AND id != NEW.id) THEN
      EXIT;
    END IF;
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  NEW.slug := new_slug;
  RETURN NEW;
END;
$$;

-- Create trigger for auto slug generation
CREATE TRIGGER trigger_generate_profile_slug
  BEFORE INSERT OR UPDATE OF full_name ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_profile_slug();

-- Generate slugs for existing profiles that have names
UPDATE public.profiles SET slug = NULL WHERE slug IS NULL AND full_name IS NOT NULL AND full_name != '';

-- Create coach_page_views tracking table
CREATE TABLE public.coach_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_user_id uuid NOT NULL,
  visitor_ip text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  viewed_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coach_page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert page views (anonymous tracking)
CREATE POLICY "Anyone can insert page views"
  ON public.coach_page_views FOR INSERT
  TO public
  WITH CHECK (true);

-- Admins can view all page views
CREATE POLICY "Admins can view all page views"
  ON public.coach_page_views FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Coaches can view their own page views
CREATE POLICY "Coaches can view own page views"
  ON public.coach_page_views FOR SELECT
  TO authenticated
  USING (auth.uid() = coach_user_id);
