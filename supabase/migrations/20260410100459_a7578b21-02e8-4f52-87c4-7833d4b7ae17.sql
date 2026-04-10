
DROP POLICY IF EXISTS "Anyone can view non-suspended coach profiles" ON public.profiles;

CREATE POLICY "Anyone can view non-suspended coach profiles"
ON public.profiles
FOR SELECT
USING (
  is_suspended = false
  AND public.has_role(user_id, 'coach'::app_role)
);
