-- Allow any authenticated user to register for webinars (not just learners)
DROP POLICY IF EXISTS "Learners can register for webinars" ON public.webinar_registrations;
CREATE POLICY "Authenticated users can register for webinars"
ON public.webinar_registrations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = learner_id);

-- Allow any authenticated user to view own registrations
DROP POLICY IF EXISTS "Learners can view own registrations" ON public.webinar_registrations;
CREATE POLICY "Users can view own registrations"
ON public.webinar_registrations
FOR SELECT
TO authenticated
USING (auth.uid() = learner_id);