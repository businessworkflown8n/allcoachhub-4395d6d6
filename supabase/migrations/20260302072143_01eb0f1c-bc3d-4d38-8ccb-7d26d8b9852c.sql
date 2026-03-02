
-- Add slug column to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION public.generate_course_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  base_slug text;
  new_slug text;
  counter integer := 0;
BEGIN
  -- Generate base slug from title
  base_slug := lower(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Truncate to reasonable length
  base_slug := left(base_slug, 80);
  
  new_slug := base_slug;
  
  -- Handle uniqueness
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.courses WHERE slug = new_slug AND id != NEW.id) THEN
      EXIT;
    END IF;
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := new_slug;
  RETURN NEW;
END;
$function$;

-- Create trigger to auto-generate slug on insert/update
CREATE TRIGGER generate_course_slug_trigger
  BEFORE INSERT OR UPDATE OF title ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_course_slug();

-- Backfill existing courses with slugs
UPDATE public.courses SET slug = lower(regexp_replace(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'), '-+', '-', 'g')) WHERE slug IS NULL;
