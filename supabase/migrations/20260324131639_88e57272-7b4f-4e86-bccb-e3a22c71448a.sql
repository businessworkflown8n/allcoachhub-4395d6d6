
-- Webinar commission table (mirrors coach_commissions for courses)
CREATE TABLE public.coach_webinar_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  commission_percent numeric NOT NULL DEFAULT 1,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(coach_id),
  CONSTRAINT webinar_commission_range CHECK (commission_percent >= 0 AND commission_percent <= 100)
);

ALTER TABLE public.coach_webinar_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage webinar commissions" ON public.coach_webinar_commissions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches can view own webinar commission" ON public.coach_webinar_commissions
  FOR SELECT TO authenticated USING (auth.uid() = coach_id);

-- Default webinar commission in platform_settings
INSERT INTO public.platform_settings (key, value) VALUES ('webinar_commission_percent', '1')
ON CONFLICT DO NOTHING;

-- Payment locked column on enrollments
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS payment_locked boolean NOT NULL DEFAULT false;
