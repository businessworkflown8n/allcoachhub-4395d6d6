
-- Add new columns to seo_page_metadata for enhanced tracking
ALTER TABLE public.seo_page_metadata
  ADD COLUMN IF NOT EXISTS indexed_date timestamptz,
  ADD COLUMN IF NOT EXISTS sitemap_included boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS indexing_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS page_title text,
  ADD COLUMN IF NOT EXISTS content_length integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS internal_links_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS image_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS images_with_alt integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS heading_structure jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seo_suggestions jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS coach_id uuid;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_seo_page_metadata_coach_id ON public.seo_page_metadata(coach_id);
CREATE INDEX IF NOT EXISTS idx_seo_page_metadata_index_status ON public.seo_page_metadata(index_status);
CREATE INDEX IF NOT EXISTS idx_seo_page_metadata_page_type ON public.seo_page_metadata(page_type);

-- Auto-detect new courses
CREATE OR REPLACE FUNCTION public.seo_auto_detect_course()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_page_url text;
BEGIN
  IF NEW.is_published = true AND NEW.approval_status = 'approved' THEN
    v_page_url := '/course/' || COALESCE(NEW.slug, NEW.id::text);
    INSERT INTO public.seo_page_metadata (page_url, page_type, meta_title, meta_description, h1_tag, primary_keyword, robots_directive, canonical_url, index_status, is_auto_generated, coach_id, page_title, sitemap_included)
    VALUES (
      v_page_url, 'course',
      LEFT(NEW.title || ' | AI Coach Portal', 70),
      LEFT(COALESCE(NEW.description, 'Learn ' || NEW.title || ' with expert coaching.'), 160),
      NEW.title, LOWER(NEW.category), 'index, follow',
      'https://www.aicoachportal.com' || v_page_url,
      'pending', true, NEW.coach_id, NEW.title, true
    )
    ON CONFLICT (page_url) DO UPDATE SET
      meta_title = EXCLUDED.meta_title,
      meta_description = EXCLUDED.meta_description,
      h1_tag = EXCLUDED.h1_tag,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seo_auto_detect_course ON public.courses;
CREATE TRIGGER trg_seo_auto_detect_course
AFTER INSERT OR UPDATE OF is_published, approval_status ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.seo_auto_detect_course();

-- Auto-detect new blogs
CREATE OR REPLACE FUNCTION public.seo_auto_detect_blog()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_page_url text;
BEGIN
  IF NEW.is_published = true THEN
    v_page_url := '/ai-blogs/' || COALESCE(NEW.slug, NEW.id::text);
    INSERT INTO public.seo_page_metadata (page_url, page_type, meta_title, meta_description, h1_tag, primary_keyword, robots_directive, canonical_url, index_status, is_auto_generated, page_title, sitemap_included)
    VALUES (
      v_page_url, 'blog',
      LEFT(COALESCE(NEW.meta_title, NEW.title || ' | AI Coach Portal'), 70),
      LEFT(COALESCE(NEW.meta_description, NEW.excerpt), 160),
      NEW.title, LOWER(NEW.category), 'index, follow',
      'https://www.aicoachportal.com' || v_page_url,
      'pending', true, NEW.title, true
    )
    ON CONFLICT (page_url) DO UPDATE SET
      meta_title = EXCLUDED.meta_title,
      meta_description = EXCLUDED.meta_description,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seo_auto_detect_blog ON public.ai_blogs;
CREATE TRIGGER trg_seo_auto_detect_blog
AFTER INSERT OR UPDATE OF is_published ON public.ai_blogs
FOR EACH ROW EXECUTE FUNCTION public.seo_auto_detect_blog();

-- Auto-detect coach websites
CREATE OR REPLACE FUNCTION public.seo_auto_detect_coach_website()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_page_url text;
BEGIN
  IF NEW.is_live = true AND NEW.status = 'approved' THEN
    v_page_url := '/coach-website/' || NEW.slug;
    INSERT INTO public.seo_page_metadata (page_url, page_type, meta_title, meta_description, robots_directive, canonical_url, index_status, is_auto_generated, coach_id, page_title, sitemap_included)
    VALUES (
      v_page_url, 'coach',
      LEFT(COALESCE(NEW.meta_title, NEW.institute_name || ' | AI Coach Portal'), 70),
      LEFT(COALESCE(NEW.meta_description, NEW.description, NEW.tagline), 160),
      'index, follow',
      'https://www.aicoachportal.com' || v_page_url,
      'pending', true, NEW.coach_id, NEW.institute_name, true
    )
    ON CONFLICT (page_url) DO UPDATE SET
      meta_title = EXCLUDED.meta_title,
      meta_description = EXCLUDED.meta_description,
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seo_auto_detect_coach_website ON public.coach_websites;
CREATE TRIGGER trg_seo_auto_detect_coach_website
AFTER INSERT OR UPDATE OF is_live, status ON public.coach_websites
FOR EACH ROW EXECUTE FUNCTION public.seo_auto_detect_coach_website();
