-- 1. Extend referrals table for course-link tracking
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS click_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_percent numeric NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS purchase_id uuid,
  ADD COLUMN IF NOT EXISTS converted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_referrals_course ON public.referrals(course_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);

-- 2. New referral_clicks table for raw click analytics
CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referrer_role text NOT NULL DEFAULT 'learner',
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  referral_code text,
  visitor_ip text,
  user_agent text,
  referrer_url text,
  clicked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ref_clicks_referrer ON public.referral_clicks(referrer_id);
CREATE INDEX IF NOT EXISTS idx_ref_clicks_course ON public.referral_clicks(course_id);
CREATE INDEX IF NOT EXISTS idx_ref_clicks_date ON public.referral_clicks(clicked_at DESC);

ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can record a click
CREATE POLICY "Anyone can record referral click"
  ON public.referral_clicks FOR INSERT
  WITH CHECK (true);

-- Referrers can see their own click logs
CREATE POLICY "Referrers view own clicks"
  ON public.referral_clicks FOR SELECT
  USING (auth.uid() = referrer_id);

-- Admins can see everything
CREATE POLICY "Admins view all referral clicks"
  ON public.referral_clicks FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Seed configurable commission rates
INSERT INTO public.communication_settings (key, value)
VALUES
  ('learner_referral_percent', '10'),
  ('coach_referral_percent', '5'),
  ('learner_referrals_enabled', 'true'),
  ('coach_referrals_enabled', 'true')
ON CONFLICT (key) DO NOTHING;