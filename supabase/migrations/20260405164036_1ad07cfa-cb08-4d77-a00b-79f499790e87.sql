
-- Platform integration config table for admin control
CREATE TABLE public.platform_integrations_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_id TEXT NOT NULL UNIQUE,
  platform_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'advertising',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  oauth_config JSONB DEFAULT '{}'::jsonb,
  setup_guide JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Coach-level platform access control
CREATE TABLE public.coach_platform_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL,
  platform_id TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  granted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(coach_id, platform_id)
);

-- Add OAuth fields to ad_platform_connections
ALTER TABLE public.ad_platform_connections
  ADD COLUMN IF NOT EXISTS account_id TEXT,
  ADD COLUMN IF NOT EXISTS account_name TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS sync_frequency TEXT DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS needs_reconnect BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sync_data_scope TEXT[] DEFAULT ARRAY['campaigns', 'conversions'];

-- Enable RLS
ALTER TABLE public.platform_integrations_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_platform_access ENABLE ROW LEVEL SECURITY;

-- Platform config: anyone can read (to show available platforms), only admins can modify
CREATE POLICY "Anyone can read platform config" ON public.platform_integrations_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage platform config" ON public.platform_integrations_config
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Coach platform access: coaches see their own, admins see all
CREATE POLICY "Coaches see own platform access" ON public.coach_platform_access
  FOR SELECT TO authenticated USING (coach_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage coach platform access" ON public.coach_platform_access
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed default platform configs
INSERT INTO public.platform_integrations_config (platform_id, platform_name, category, is_enabled, setup_guide) VALUES
  ('google_ads', 'Google Ads', 'advertising', true, '{"steps": [{"title": "Login to Google Ads", "description": "Ensure you are logged into your Google Ads account at ads.google.com"}, {"title": "Grant Permissions", "description": "Allow read-only access to your campaign performance data"}, {"title": "Select Account", "description": "Choose the ad account you want to connect"}], "prerequisites": ["Active Google Ads account", "At least one campaign created"], "common_errors": ["Permission denied - ensure you have admin access", "No accounts found - check your Google Ads login"]}'),
  ('meta_ads', 'Meta Ads', 'advertising', true, '{"steps": [{"title": "Login to Facebook", "description": "Ensure you are logged into your Facebook account with Business Manager access"}, {"title": "Select Ad Account", "description": "Choose which ad account to connect from Business Manager"}, {"title": "Grant Permissions", "description": "Allow access to read campaign and conversion data"}], "prerequisites": ["Facebook Business Manager account", "Ad account with campaigns"], "common_errors": ["Business verification required", "No ad accounts found in Business Manager"]}'),
  ('tiktok_ads', 'TikTok Ads', 'advertising', true, '{"steps": [{"title": "Login to TikTok Ads", "description": "Sign in to your TikTok Ads Manager account"}, {"title": "Authorize Access", "description": "Grant read-only access to campaign metrics"}, {"title": "Select Advertiser", "description": "Choose the advertiser account to sync"}], "prerequisites": ["TikTok Ads Manager account", "At least one campaign"], "common_errors": ["Account not verified", "Region restrictions may apply"]}'),
  ('linkedin_ads', 'LinkedIn Ads', 'advertising', true, '{"steps": [{"title": "Login to LinkedIn", "description": "Sign in with your LinkedIn account that has Campaign Manager access"}, {"title": "Select Ad Account", "description": "Choose the LinkedIn Ad Account to connect"}, {"title": "Authorize", "description": "Grant permission to read campaign analytics"}], "prerequisites": ["LinkedIn Campaign Manager access", "Active ad account"], "common_errors": ["Insufficient permissions - need Campaign Manager role", "Organization not found"]}'),
  ('bing_ads', 'Bing Ads', 'advertising', true, '{"steps": [{"title": "Login to Microsoft Advertising", "description": "Sign in with your Microsoft account"}, {"title": "Select Account", "description": "Choose which advertising account to connect"}, {"title": "Grant Access", "description": "Allow read-only access to campaign data"}], "prerequisites": ["Microsoft Advertising account", "Active campaigns"], "common_errors": ["Account suspended", "Multi-factor authentication required"]}'),
  ('ga4', 'Google Analytics 4', 'analytics', true, '{"steps": [{"title": "Login to Google", "description": "Ensure you are logged into the Google account with GA4 access"}, {"title": "Select Property", "description": "Choose the GA4 property to connect"}, {"title": "Grant Permissions", "description": "Allow read-only access to analytics data"}], "prerequisites": ["GA4 property set up", "Editor or Viewer access"], "common_errors": ["Property not found", "Insufficient permissions"]}'),
  ('gtm', 'Google Tag Manager', 'analytics', true, '{"steps": [{"title": "Login to Google", "description": "Sign in with your Google account that has GTM access"}, {"title": "Select Container", "description": "Choose the GTM container to connect"}, {"title": "Authorize", "description": "Grant read access to container configuration"}], "prerequisites": ["GTM container created", "Admin or Publish access"], "common_errors": ["Container not found", "Access denied"]}');
