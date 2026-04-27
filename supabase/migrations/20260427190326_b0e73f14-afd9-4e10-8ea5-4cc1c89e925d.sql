-- Add system-reserved flag to coach_categories and protect "Others"
ALTER TABLE public.coach_categories
  ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false;

-- Mark "Others" as system-reserved (always active)
UPDATE public.coach_categories
SET is_system = true, is_active = true
WHERE slug = 'others';

-- Insert "Others" if missing (safety)
INSERT INTO public.coach_categories (name, slug, icon, sort_order, is_active, is_system)
SELECT 'Others', 'others', '📦', 999, true, true
WHERE NOT EXISTS (SELECT 1 FROM public.coach_categories WHERE slug = 'others');

-- Prevent delete/deactivate/rename of system categories
CREATE OR REPLACE FUNCTION public.protect_system_category()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.is_system = true THEN
      RAISE EXCEPTION 'Cannot delete system-reserved category "%"', OLD.name;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_system = true THEN
      IF NEW.slug IS DISTINCT FROM OLD.slug THEN
        RAISE EXCEPTION 'Cannot change slug of system-reserved category "%"', OLD.name;
      END IF;
      IF NEW.is_active = false THEN
        RAISE EXCEPTION 'Cannot deactivate system-reserved category "%"', OLD.name;
      END IF;
      -- ensure flag stays
      NEW.is_system := true;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_system_category ON public.coach_categories;
CREATE TRIGGER trg_protect_system_category
BEFORE UPDATE OR DELETE ON public.coach_categories
FOR EACH ROW EXECUTE FUNCTION public.protect_system_category();

-- Course category fallback: ensure courses always map to a valid category, default "Others"
CREATE OR REPLACE FUNCTION public.ensure_course_category_fallback()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  exists_match boolean;
BEGIN
  -- Null/empty -> Others
  IF NEW.category IS NULL OR btrim(NEW.category) = '' THEN
    NEW.category := 'Others';
    RETURN NEW;
  END IF;

  -- Validate against active categories (case-insensitive name match)
  SELECT EXISTS (
    SELECT 1 FROM public.coach_categories
    WHERE is_active = true AND lower(name) = lower(NEW.category)
  ) INTO exists_match;

  IF NOT exists_match THEN
    NEW.category := 'Others';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_courses_category_fallback ON public.courses;
CREATE TRIGGER trg_courses_category_fallback
BEFORE INSERT OR UPDATE OF category ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.ensure_course_category_fallback();

-- When a category is deleted/deactivated, reassign its courses to "Others"
CREATE OR REPLACE FUNCTION public.reassign_courses_on_category_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.courses SET category = 'Others'
    WHERE lower(category) = lower(OLD.name);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Deactivated or renamed
    IF (OLD.is_active = true AND NEW.is_active = false)
       OR (OLD.name IS DISTINCT FROM NEW.name) THEN
      UPDATE public.courses SET category = 'Others'
      WHERE lower(category) = lower(OLD.name)
        AND (NEW.is_active = false OR OLD.name <> NEW.name);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_category_change_reassign ON public.coach_categories;
CREATE TRIGGER trg_category_change_reassign
AFTER UPDATE OR DELETE ON public.coach_categories
FOR EACH ROW EXECUTE FUNCTION public.reassign_courses_on_category_change();

-- Backfill: any existing course with empty/invalid category -> "Others"
UPDATE public.courses c
SET category = 'Others'
WHERE c.category IS NULL
   OR btrim(c.category) = ''
   OR NOT EXISTS (
     SELECT 1 FROM public.coach_categories cc
     WHERE cc.is_active = true AND lower(cc.name) = lower(c.category)
   );

-- DB-level guard against null category
ALTER TABLE public.courses ALTER COLUMN category SET DEFAULT 'Others';