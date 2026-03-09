
-- Add coach_id to email_campaigns so coaches can own campaigns
ALTER TABLE public.email_campaigns ADD COLUMN IF NOT EXISTS coach_id uuid DEFAULT NULL;

-- RLS: Coaches can manage their own campaigns
CREATE POLICY "Coaches can manage own campaigns"
ON public.email_campaigns
FOR ALL
TO authenticated
USING (auth.uid() = coach_id)
WITH CHECK (auth.uid() = coach_id);

-- RLS: Coaches can view their own campaigns
CREATE POLICY "Coaches can view own campaigns"
ON public.email_campaigns
FOR SELECT
TO authenticated
USING (auth.uid() = coach_id);
