-- 1. Features catalog
CREATE TABLE public.features_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  depends_on TEXT[] DEFAULT '{}',
  supports_usage_limit BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Global controls + plan tiering
CREATE TABLE public.feature_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE REFERENCES public.features_master(feature_key) ON DELETE CASCADE,
  global_enabled BOOLEAN NOT NULL DEFAULT true,
  free_enabled BOOLEAN NOT NULL DEFAULT false,
  pro_enabled BOOLEAN NOT NULL DEFAULT true,
  premium_enabled BOOLEAN NOT NULL DEFAULT true,
  default_usage_limit INTEGER,
  free_usage_limit INTEGER,
  pro_usage_limit INTEGER,
  premium_usage_limit INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

-- 3. Per-coach overrides
CREATE TABLE public.coach_feature_override (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  feature_key TEXT NOT NULL REFERENCES public.features_master(feature_key) ON DELETE CASCADE,
  enabled BOOLEAN,
  usage_limit INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  UNIQUE (coach_id, feature_key)
);

-- 4. Audit log
CREATE TABLE public.feature_control_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL,
  scope TEXT NOT NULL, -- 'global' | 'coach'
  coach_id UUID,
  changed_by UUID,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.features_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_feature_override ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_control_audit ENABLE ROW LEVEL SECURITY;

-- Policies: features_master
CREATE POLICY "features_master readable by authenticated"
  ON public.features_master FOR SELECT TO authenticated USING (true);
CREATE POLICY "features_master admin write"
  ON public.features_master FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policies: feature_controls
CREATE POLICY "feature_controls readable by authenticated"
  ON public.feature_controls FOR SELECT TO authenticated USING (true);
CREATE POLICY "feature_controls admin write"
  ON public.feature_controls FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policies: coach_feature_override
CREATE POLICY "coach reads own override"
  ON public.coach_feature_override FOR SELECT TO authenticated
  USING (coach_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manages overrides"
  ON public.coach_feature_override FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policies: audit
CREATE POLICY "admin reads audit"
  ON public.feature_control_audit FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin inserts audit"
  ON public.feature_control_audit FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Audit triggers
CREATE OR REPLACE FUNCTION public.log_feature_control_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.feature_control_audit (feature_key, scope, changed_by, old_value, new_value)
  VALUES (
    COALESCE(NEW.feature_key, OLD.feature_key),
    'global',
    auth.uid(),
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_coach_override_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.feature_control_audit (feature_key, scope, coach_id, changed_by, old_value, new_value)
  VALUES (
    COALESCE(NEW.feature_key, OLD.feature_key),
    'coach',
    COALESCE(NEW.coach_id, OLD.coach_id),
    auth.uid(),
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_feature_controls_audit
AFTER INSERT OR UPDATE OR DELETE ON public.feature_controls
FOR EACH ROW EXECUTE FUNCTION public.log_feature_control_change();

CREATE TRIGGER trg_coach_override_audit
AFTER INSERT OR UPDATE OR DELETE ON public.coach_feature_override
FOR EACH ROW EXECUTE FUNCTION public.log_coach_override_change();

-- Updated_at triggers
CREATE TRIGGER trg_features_master_updated BEFORE UPDATE ON public.features_master
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_feature_controls_updated BEFORE UPDATE ON public.feature_controls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_coach_override_updated BEFORE UPDATE ON public.coach_feature_override
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Effective feature resolver (global + plan + override + dependencies)
CREATE OR REPLACE FUNCTION public.get_effective_feature(_coach_id UUID, _feature_key TEXT, _plan TEXT DEFAULT 'free')
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ctrl public.feature_controls%ROWTYPE;
  ovr public.coach_feature_override%ROWTYPE;
  fm public.features_master%ROWTYPE;
  dep TEXT;
  dep_res JSONB;
  enabled BOOLEAN;
  limit_val INTEGER;
BEGIN
  SELECT * INTO fm FROM public.features_master WHERE feature_key = _feature_key;
  IF NOT FOUND THEN RETURN jsonb_build_object('enabled', false, 'reason', 'unknown'); END IF;

  SELECT * INTO ctrl FROM public.feature_controls WHERE feature_key = _feature_key;
  IF NOT FOUND OR ctrl.global_enabled = false THEN
    RETURN jsonb_build_object('enabled', false, 'reason', 'global_off');
  END IF;

  enabled := CASE _plan
    WHEN 'premium' THEN ctrl.premium_enabled
    WHEN 'pro' THEN ctrl.pro_enabled
    ELSE ctrl.free_enabled
  END;
  limit_val := CASE _plan
    WHEN 'premium' THEN ctrl.premium_usage_limit
    WHEN 'pro' THEN ctrl.pro_usage_limit
    ELSE ctrl.free_usage_limit
  END;

  SELECT * INTO ovr FROM public.coach_feature_override
    WHERE coach_id = _coach_id AND feature_key = _feature_key;
  IF FOUND THEN
    IF ovr.enabled IS NOT NULL THEN enabled := ovr.enabled; END IF;
    IF ovr.usage_limit IS NOT NULL THEN limit_val := ovr.usage_limit; END IF;
  END IF;

  -- Dependency check
  IF fm.depends_on IS NOT NULL THEN
    FOREACH dep IN ARRAY fm.depends_on LOOP
      dep_res := public.get_effective_feature(_coach_id, dep, _plan);
      IF (dep_res->>'enabled')::boolean = false THEN
        RETURN jsonb_build_object('enabled', false, 'reason', 'dependency_off', 'dependency', dep);
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('enabled', enabled, 'usage_limit', limit_val, 'reason', CASE WHEN enabled THEN 'allowed' ELSE 'plan_locked' END);
END;
$$;

-- Seed features
INSERT INTO public.features_master (feature_key, name, description, category, depends_on, supports_usage_limit, sort_order) VALUES
  ('lead_management',      'Lead Management',           'Lead capture, funnels, follow-ups',          'growth',       '{}',                       true,  10),
  ('analytics',            'Analytics',                 'Coach analytics & reporting dashboards',      'insights',     '{}',                       false, 20),
  ('monetization',         'Monetization',              'Pricing, coupons, payments',                  'revenue',      '{}',                       false, 30),
  ('coupons',              'Coupons',                   'Discount coupon engine',                      'revenue',      '{monetization}',           true,  31),
  ('booking_system',       'Booking System',            '1:1 session bookings & scheduling',           'sessions',     '{monetization}',           true,  40),
  ('ai_assistant',         'AI Assistant',              'AI co-pilot (credit-based)',                  'ai',           '{}',                       true,  50),
  ('automation',           'Automation',                'Email & WhatsApp automation',                 'engagement',   '{}',                       true,  60),
  ('community',            'Community',                 'Coach community spaces',                      'engagement',   '{}',                       false, 70),
  ('content_upload',       'Content & Materials',       'Course/material uploads',                     'content',      '{}',                       true,  80),
  ('branding_tools',       'Branding Tools',            'Custom logos, themes, white-labeling',        'branding',     '{}',                       false, 90),
  ('integrations',         'Integrations',              'Third-party platform integrations',           'platform',     '{}',                       true,  100)
ON CONFLICT (feature_key) DO NOTHING;

-- Seed default controls
INSERT INTO public.feature_controls (feature_key, global_enabled, free_enabled, pro_enabled, premium_enabled, free_usage_limit, pro_usage_limit, premium_usage_limit)
SELECT feature_key, true,
  CASE WHEN feature_key IN ('analytics','content_upload') THEN true ELSE false END,
  true, true,
  CASE WHEN feature_key = 'ai_assistant' THEN 50 WHEN feature_key = 'lead_management' THEN 100 ELSE NULL END,
  CASE WHEN feature_key = 'ai_assistant' THEN 500 WHEN feature_key = 'lead_management' THEN 1000 ELSE NULL END,
  CASE WHEN feature_key = 'ai_assistant' THEN 5000 ELSE NULL END
FROM public.features_master
ON CONFLICT (feature_key) DO NOTHING;