
-- Campaign contacts table for imported/attached audiences
CREATE TABLE public.campaign_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE CASCADE NOT NULL,
  first_name text,
  last_name text,
  full_name text,
  email text,
  phone text,
  country_code text,
  whatsapp_number text,
  company text,
  role text,
  tags text[] DEFAULT '{}',
  custom_fields jsonb DEFAULT '{}',
  source text NOT NULL DEFAULT 'csv_upload',
  is_valid boolean NOT NULL DEFAULT true,
  is_duplicate boolean NOT NULL DEFAULT false,
  validation_errors text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Campaign activity log for per-contact tracking
CREATE TABLE public.campaign_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE CASCADE NOT NULL,
  contact_email text,
  contact_phone text,
  contact_name text,
  source text DEFAULT 'platform',
  channel text NOT NULL DEFAULT 'email',
  status text NOT NULL DEFAULT 'queued',
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  replied_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add reporting columns to email_campaigns
ALTER TABLE public.email_campaigns
  ADD COLUMN IF NOT EXISTS audience_source text DEFAULT 'platform',
  ADD COLUMN IF NOT EXISTS attached_file_name text,
  ADD COLUMN IF NOT EXISTS import_mapping jsonb,
  ADD COLUMN IF NOT EXISTS total_imported integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_valid integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_invalid integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_duplicates_removed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_delivered integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_failed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_opened integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_clicked integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_replied integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_bounced integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_unsubscribed integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS open_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS click_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_rate numeric DEFAULT 0;

-- RLS for campaign_contacts
ALTER TABLE public.campaign_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaign contacts" ON public.campaign_contacts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Coaches can manage own campaign contacts" ON public.campaign_contacts
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.email_campaigns ec WHERE ec.id = campaign_contacts.campaign_id AND ec.coach_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.email_campaigns ec WHERE ec.id = campaign_contacts.campaign_id AND ec.coach_id = auth.uid()));

-- RLS for campaign_activity_log
ALTER TABLE public.campaign_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage activity logs" ON public.campaign_activity_log
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Coaches can view own campaign logs" ON public.campaign_activity_log
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.email_campaigns ec WHERE ec.id = campaign_activity_log.campaign_id AND ec.coach_id = auth.uid()));
