
-- Add slug and seo_meta columns to ai_blogs for SEO blog routing
ALTER TABLE public.ai_blogs
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS author text DEFAULT 'AI Coach Portal';

-- Create function to auto-generate slug from title for ai_blogs
CREATE OR REPLACE FUNCTION public.generate_blog_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  base_slug text;
  new_slug text;
  counter integer := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug != '' THEN
    RETURN NEW;
  END IF;
  base_slug := lower(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  base_slug := left(base_slug, 80);
  new_slug := base_slug;
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.ai_blogs WHERE slug = new_slug AND id != NEW.id) THEN
      EXIT;
    END IF;
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  NEW.slug := new_slug;
  RETURN NEW;
END;
$function$;

-- Create trigger for auto slug generation
DROP TRIGGER IF EXISTS trigger_generate_blog_slug ON public.ai_blogs;
CREATE TRIGGER trigger_generate_blog_slug
  BEFORE INSERT OR UPDATE ON public.ai_blogs
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_blog_slug();

-- Backfill existing rows with slugs
UPDATE public.ai_blogs SET slug = NULL WHERE slug IS NULL;
