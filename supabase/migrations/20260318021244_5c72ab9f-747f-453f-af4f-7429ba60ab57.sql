
-- Ad platform connections for tracking integration status
CREATE TABLE public.ad_platform_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  platform text NOT NULL,
  status text NOT NULL DEFAULT 'disconnected',
  credentials_encrypted jsonb,
  last_sync_at timestamp with time zone,
  error_log text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(coach_id, platform)
);

ALTER TABLE public.ad_platform_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own connections" ON public.ad_platform_connections
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Admins can manage all connections" ON public.ad_platform_connections
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Campaign performance data (unified across platforms)
CREATE TABLE public.campaign_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  platform text NOT NULL,
  campaign_name text NOT NULL,
  campaign_id_external text,
  date date NOT NULL,
  spend numeric NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  leads integer NOT NULL DEFAULT 0,
  cpc numeric GENERATED ALWAYS AS (CASE WHEN clicks > 0 THEN spend / clicks ELSE 0 END) STORED,
  ctr numeric GENERATED ALWAYS AS (CASE WHEN impressions > 0 THEN (clicks::numeric / impressions) * 100 ELSE 0 END) STORED,
  roas numeric GENERATED ALWAYS AS (CASE WHEN spend > 0 THEN revenue / spend ELSE 0 END) STORED,
  cpa numeric GENERATED ALWAYS AS (CASE WHEN conversions > 0 THEN spend / conversions ELSE 0 END) STORED,
  source text DEFAULT 'manual',
  country text,
  device text,
  product_name text,
  product_sku text,
  product_category text,
  add_to_cart integer DEFAULT 0,
  checkouts integer DEFAULT 0,
  purchases integer DEFAULT 0,
  gross_revenue numeric DEFAULT 0,
  net_revenue numeric DEFAULT 0,
  refunds numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own metrics" ON public.campaign_metrics
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Admins can manage all metrics" ON public.campaign_metrics
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Report sharing requests
CREATE TABLE public.report_sharing_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  recipient_name text NOT NULL,
  recipient_email text NOT NULL,
  recipient_role text DEFAULT 'viewer',
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  access_token text,
  approved_at timestamp with time zone,
  rejected_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.report_sharing_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own sharing requests" ON public.report_sharing_requests
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Admins can manage all sharing requests" ON public.report_sharing_requests
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Audit log for report access
CREATE TABLE public.report_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  metadata jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.report_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs" ON public.report_audit_log
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert audit logs" ON public.report_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);
