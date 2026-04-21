
-- 1. Tighten funnel_jobs RLS
DROP POLICY IF EXISTS "Anyone can insert funnel jobs" ON public.funnel_jobs;
DROP POLICY IF EXISTS "Anyone can update funnel jobs" ON public.funnel_jobs;
DROP POLICY IF EXISTS "Anyone can view funnel jobs" ON public.funnel_jobs;

-- Admins can view all jobs
CREATE POLICY "Admins can view funnel jobs"
ON public.funnel_jobs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update jobs (service role bypasses RLS for the processor)
CREATE POLICY "Admins can update funnel jobs"
ON public.funnel_jobs FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can delete jobs
CREATE POLICY "Admins can delete funnel jobs"
ON public.funnel_jobs FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- No public INSERT policy: jobs are created by the funnel-trigger edge function
-- using the service role, which bypasses RLS.

-- 2. Fix mutable search_path on pgmq helper functions
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
