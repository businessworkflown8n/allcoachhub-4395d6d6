-- Add new columns to webinars table for enhanced features
ALTER TABLE public.webinars
  ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_usd numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_inr numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_attendees integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurring_pattern text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS registration_required boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS waiting_room boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_record boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS meeting_type text NOT NULL DEFAULT 'external',
  ADD COLUMN IF NOT EXISTS webinar_type text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS coupon_code text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS total_revenue numeric NOT NULL DEFAULT 0;

-- Add attendance tracking columns to webinar_registrations
ALTER TABLE public.webinar_registrations
  ADD COLUMN IF NOT EXISTS join_time timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS leave_time timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS attended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS watch_duration_minutes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS converted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS amount_paid numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reminder_24h_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_1h_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_10m_sent boolean NOT NULL DEFAULT false;

-- Create webinar_payments table for paid webinar tracking
CREATE TABLE IF NOT EXISTS public.webinar_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id uuid NOT NULL REFERENCES public.webinars(id) ON DELETE CASCADE,
  learner_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  payment_id text DEFAULT NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  coupon_code text DEFAULT NULL,
  discount_percent numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.webinar_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage webinar payments" ON public.webinar_payments
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Learners can view own payments" ON public.webinar_payments
  FOR SELECT TO authenticated USING (learner_id = auth.uid());

CREATE POLICY "Learners can insert own payments" ON public.webinar_payments
  FOR INSERT TO authenticated WITH CHECK (learner_id = auth.uid());

CREATE POLICY "Coaches can view payments for their webinars" ON public.webinar_payments
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.webinars w WHERE w.id = webinar_payments.webinar_id AND w.coach_id = auth.uid())
  );