
-- Funnel configuration per landing page
CREATE TABLE public.funnel_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id uuid REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  is_enabled boolean DEFAULT true,
  welcome_email_subject text DEFAULT 'Welcome to AI Coach Portal!',
  welcome_email_body text DEFAULT 'Hi {{name}}, thank you for your interest in becoming a coach on our platform. We''re excited to have you!',
  day1_email_subject text DEFAULT 'Your Coaching Journey Starts Here',
  day1_email_body text DEFAULT 'Hi {{name}}, here''s how you can get started as a coach on AI Coach Portal...',
  day1_delay_hours integer DEFAULT 24,
  day1_enabled boolean DEFAULT true,
  day2_email_subject text DEFAULT 'Coaches Like You Are Earning ₹80K/Month',
  day2_email_body text DEFAULT 'Hi {{name}}, did you know our coaches earn an average of ₹80,000 per month? Join today!',
  day2_delay_hours integer DEFAULT 48,
  day2_enabled boolean DEFAULT true,
  day3_email_subject text DEFAULT 'Last Chance: Limited Slots Available',
  day3_email_body text DEFAULT 'Hi {{name}}, slots are filling up fast. Register now to secure your spot as an AI Coach.',
  day3_delay_hours integer DEFAULT 72,
  day3_enabled boolean DEFAULT true,
  welcome_whatsapp_message text DEFAULT 'Hi {{name}}! Thank you for your interest in AI Coach Portal. We will reach out to you shortly.',
  whatsapp_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(landing_page_id)
);

-- Funnel job queue
CREATE TABLE public.funnel_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.landing_page_leads(id) ON DELETE CASCADE NOT NULL,
  landing_page_id uuid REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  job_type text NOT NULL, -- welcome_email, day1_email, day2_email, day3_email, welcome_whatsapp
  status text DEFAULT 'pending', -- pending, processing, sent, failed, skipped
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  error_message text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  created_at timestamptz DEFAULT now()
);

-- Email send log for funnel
CREATE TABLE public.funnel_email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.landing_page_leads(id) ON DELETE CASCADE NOT NULL,
  email_type text NOT NULL,
  subject text,
  recipient_email text NOT NULL,
  status text DEFAULT 'sent', -- sent, failed, bounced
  error_message text,
  sent_at timestamptz DEFAULT now()
);

-- Event tracking for funnel analytics
CREATE TABLE public.funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.landing_page_leads(id) ON DELETE CASCADE,
  landing_page_id uuid REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- lead_created, welcome_sent, day1_sent, day2_sent, day3_sent, cta_clicked, registered, funnel_stopped
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_funnel_jobs_status_scheduled ON public.funnel_jobs(status, scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_funnel_jobs_lead_id ON public.funnel_jobs(lead_id);
CREATE INDEX idx_funnel_events_lead ON public.funnel_events(lead_id);
CREATE INDEX idx_funnel_events_landing_page ON public.funnel_events(landing_page_id);
CREATE INDEX idx_funnel_email_logs_lead ON public.funnel_email_logs(lead_id);

-- Enable RLS
ALTER TABLE public.funnel_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

-- Funnel config: public read, authenticated write
CREATE POLICY "Anyone can view funnel config" ON public.funnel_config FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage funnel config" ON public.funnel_config FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Funnel jobs: public access (edge functions use service role, but admin needs read)
CREATE POLICY "Anyone can view funnel jobs" ON public.funnel_jobs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert funnel jobs" ON public.funnel_jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update funnel jobs" ON public.funnel_jobs FOR UPDATE USING (true);

-- Email logs: public read, insert
CREATE POLICY "Anyone can view email logs" ON public.funnel_email_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert email logs" ON public.funnel_email_logs FOR INSERT WITH CHECK (true);

-- Events: public access
CREATE POLICY "Anyone can view funnel events" ON public.funnel_events FOR SELECT USING (true);
CREATE POLICY "Anyone can insert funnel events" ON public.funnel_events FOR INSERT WITH CHECK (true);

-- Updated_at trigger for funnel_config
CREATE TRIGGER update_funnel_config_updated_at
  BEFORE UPDATE ON public.funnel_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add status column to landing_page_leads if not exists
ALTER TABLE public.landing_page_leads ADD COLUMN IF NOT EXISTS lead_status text DEFAULT 'new';
