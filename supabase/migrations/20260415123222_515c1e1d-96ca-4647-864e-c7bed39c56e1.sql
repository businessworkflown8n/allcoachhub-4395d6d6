
-- Add thumbnail approval columns to courses
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS thumbnail_status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS thumbnail_approved_by uuid NULL,
ADD COLUMN IF NOT EXISTS thumbnail_approved_at timestamptz NULL;

-- Set existing thumbnails as approved (backward compat)
UPDATE public.courses SET thumbnail_status = 'approved' WHERE thumbnail_url IS NOT NULL;

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_thumbnail_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.thumbnail_status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid thumbnail status';
  END IF;
  -- Reset approval on re-upload
  IF OLD.thumbnail_url IS DISTINCT FROM NEW.thumbnail_url AND NEW.thumbnail_url IS NOT NULL THEN
    NEW.thumbnail_status := 'pending';
    NEW.thumbnail_approved_by := NULL;
    NEW.thumbnail_approved_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_thumbnail_before_update
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.validate_thumbnail_status();
