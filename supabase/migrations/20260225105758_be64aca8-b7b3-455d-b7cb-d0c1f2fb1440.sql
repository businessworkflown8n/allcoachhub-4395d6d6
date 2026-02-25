-- Fix SECURITY DEFINER views by recreating with security_invoker = true
DROP VIEW IF EXISTS public.coach_profiles_public;
CREATE VIEW public.coach_profiles_public
WITH (security_invoker = true) AS
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

DROP VIEW IF EXISTS public.public_reviews;
CREATE VIEW public.public_reviews
WITH (security_invoker = true) AS
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

-- The views need RLS-bypass: add a SELECT policy on profiles for the view queries
-- Since security_invoker means the querying user's RLS applies, we need 
-- a policy that allows reading coach profiles publicly
CREATE POLICY "Anyone can view non-suspended coach profiles"
ON public.profiles FOR SELECT
USING (
  is_suspended = false
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = profiles.user_id
    AND user_roles.role = 'coach'
  )
);