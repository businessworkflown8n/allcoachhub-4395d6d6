-- 1. Commission validation trigger
CREATE OR REPLACE FUNCTION public.validate_commission_percent()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.key = 'commission_percent' THEN
    IF NEW.value::numeric < 0 OR NEW.value::numeric > 100 THEN
      RAISE EXCEPTION 'Commission percent must be between 0 and 100';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS validate_commission_percent_trigger ON public.platform_settings;
CREATE TRIGGER validate_commission_percent_trigger
  BEFORE INSERT OR UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_commission_percent();

-- 2. Create public coach profiles view (non-sensitive fields only)
CREATE OR REPLACE VIEW public.coach_profiles_public AS
SELECT
  p.user_id,
  p.full_name,
  p.bio,
  p.avatar_url,
  p.category,
  p.job_title,
  p.industry,
  p.experience,
  p.education,
  p.certifications,
  p.intro_video_url,
  p.country,
  p.created_at
FROM public.profiles p
WHERE EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_roles.user_id = p.user_id
  AND user_roles.role = 'coach'
)
AND p.is_suspended = false;

GRANT SELECT ON public.coach_profiles_public TO authenticated;
GRANT SELECT ON public.coach_profiles_public TO anon;

-- 3. Create public reviews view (hides learner_id)
CREATE OR REPLACE VIEW public.public_reviews AS
SELECT
  id,
  course_id,
  coach_id,
  rating,
  comment,
  created_at,
  substring(md5(learner_id::text), 1, 8) as anonymous_reviewer_id
FROM public.reviews
WHERE is_approved = true;

GRANT SELECT ON public.public_reviews TO authenticated;
GRANT SELECT ON public.public_reviews TO anon;

-- 4. Remove public SELECT policy on reviews table (use view instead)
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;