
-- ============================================================
-- PHASE 1: Plans, Bundles, Subscriptions, Audit, Access Requests
-- ============================================================

-- 1. Subscription Plans
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly','yearly','lifetime','custom')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  highlight BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage plans" ON public.subscription_plans
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Feature Bundles
CREATE TABLE public.feature_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  feature_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active bundles" ON public.feature_bundles
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage bundles" ON public.feature_bundles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_feature_bundles_updated_at
  BEFORE UPDATE ON public.feature_bundles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Coach Subscriptions
CREATE TABLE public.coach_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL UNIQUE,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  bundle_id UUID REFERENCES public.feature_bundles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','trialing','canceled','expired','suspended')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  notes TEXT,
  assigned_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches view own subscription" ON public.coach_subscriptions
  FOR SELECT USING (coach_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage subscriptions" ON public.coach_subscriptions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_coach_subscriptions_updated_at
  BEFORE UPDATE ON public.coach_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Feature Access Audit Log
CREATE TABLE public.feature_access_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  changed_by UUID,
  feature_key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','bundle','plan','request','system')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_access_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view audit log" ON public.feature_access_audit_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Coaches view own audit" ON public.feature_access_audit_log
  FOR SELECT USING (coach_id = auth.uid());
CREATE POLICY "System inserts audit" ON public.feature_access_audit_log
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_audit_coach ON public.feature_access_audit_log(coach_id, created_at DESC);

-- 5. Feature Access Requests
CREATE TABLE public.feature_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  feature_key TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied','cancelled')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  reviewer_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own requests" ON public.feature_access_requests
  FOR ALL USING (coach_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (coach_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_access_requests_status ON public.feature_access_requests(status, created_at DESC);

CREATE TRIGGER update_feature_access_requests_updated_at
  BEFORE UPDATE ON public.feature_access_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Effective Features Function (bundle defaults + manual overrides)
CREATE OR REPLACE FUNCTION public.get_coach_effective_features(_coach_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bundle_flags JSONB := '{}'::jsonb;
  manual_flags JSONB := '{}'::jsonb;
  result JSONB;
BEGIN
  SELECT fb.feature_flags INTO bundle_flags
  FROM public.coach_subscriptions cs
  JOIN public.feature_bundles fb ON fb.id = cs.bundle_id
  WHERE cs.coach_id = _coach_id AND cs.status IN ('active','trialing')
  LIMIT 1;

  SELECT to_jsonb(cf) - 'id' - 'coach_id' - 'created_at' - 'updated_at' - 'approved_at' - 'approved_by' - 'notes'
  INTO manual_flags
  FROM public.coach_feature_flags cf
  WHERE cf.coach_id = _coach_id;

  result := COALESCE(bundle_flags, '{}'::jsonb) || COALESCE(manual_flags, '{}'::jsonb);
  RETURN result;
END;
$$;

-- 7. Audit trigger on coach_feature_flags
CREATE OR REPLACE FUNCTION public.log_feature_flag_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  flag_keys TEXT[] := ARRAY['workshops_access','courses_access','feed_access','messaging_access','paid_content_access','contact_access','profile_picture_access','blueprint_access','materials_access','status'];
  k TEXT;
  old_v JSONB;
  new_v JSONB;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    FOREACH k IN ARRAY flag_keys LOOP
      old_v := to_jsonb(OLD) -> k;
      new_v := to_jsonb(NEW) -> k;
      IF old_v IS DISTINCT FROM new_v THEN
        INSERT INTO public.feature_access_audit_log (coach_id, changed_by, feature_key, old_value, new_value, source)
        VALUES (NEW.coach_id, auth.uid(), k, old_v, new_v, 'manual');
      END IF;
    END LOOP;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.feature_access_audit_log (coach_id, changed_by, feature_key, old_value, new_value, source)
    VALUES (NEW.coach_id, auth.uid(), '__created__', NULL, to_jsonb(NEW), 'system');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER coach_feature_flags_audit
  AFTER INSERT OR UPDATE ON public.coach_feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.log_feature_flag_changes();

-- 8. Seed plans
INSERT INTO public.subscription_plans (name, slug, description, price, billing_interval, sort_order, highlight) VALUES
  ('Free', 'free', 'Get started — basic profile and blueprint access.', 0, 'monthly', 1, false),
  ('Starter', 'starter', 'Launch your first courses and connect with learners.', 999, 'monthly', 2, false),
  ('Pro', 'pro', 'Grow with workshops, materials, and social tools.', 2999, 'monthly', 3, true),
  ('Premium', 'premium', 'Full marketing suite: campaigns, WhatsApp, website, automations.', 5999, 'monthly', 4, false),
  ('Corporate', 'corporate', 'Everything unlocked for institutions and teams.', 14999, 'monthly', 5, false);

-- 9. Seed bundles
INSERT INTO public.feature_bundles (name, slug, description, plan_id, feature_flags, sort_order) VALUES
  ('Free Bundle', 'free-bundle',
    'Profile, Blueprint and basic discovery.',
    (SELECT id FROM public.subscription_plans WHERE slug='free'),
    '{"workshops_access":false,"courses_access":false,"feed_access":false,"messaging_access":false,"paid_content_access":false,"contact_access":false,"profile_picture_access":true,"blueprint_access":true,"materials_access":false}'::jsonb,
    1),
  ('Starter Bundle', 'starter-bundle',
    'Courses + Materials + Profile.',
    (SELECT id FROM public.subscription_plans WHERE slug='starter'),
    '{"workshops_access":false,"courses_access":true,"feed_access":false,"messaging_access":false,"paid_content_access":false,"contact_access":false,"profile_picture_access":true,"blueprint_access":true,"materials_access":true}'::jsonb,
    2),
  ('Pro Bundle', 'pro-bundle',
    'Adds Workshops, Social Hub and Contact access.',
    (SELECT id FROM public.subscription_plans WHERE slug='pro'),
    '{"workshops_access":true,"courses_access":true,"feed_access":true,"messaging_access":false,"paid_content_access":true,"contact_access":true,"profile_picture_access":true,"blueprint_access":true,"materials_access":true}'::jsonb,
    3),
  ('Premium Bundle', 'premium-bundle',
    'Adds Email & WhatsApp messaging campaigns.',
    (SELECT id FROM public.subscription_plans WHERE slug='premium'),
    '{"workshops_access":true,"courses_access":true,"feed_access":true,"messaging_access":true,"paid_content_access":true,"contact_access":true,"profile_picture_access":true,"blueprint_access":true,"materials_access":true}'::jsonb,
    4),
  ('Corporate Bundle', 'corporate-bundle',
    'Everything unlocked for institutions.',
    (SELECT id FROM public.subscription_plans WHERE slug='corporate'),
    '{"workshops_access":true,"courses_access":true,"feed_access":true,"messaging_access":true,"paid_content_access":true,"contact_access":true,"profile_picture_access":true,"blueprint_access":true,"materials_access":true}'::jsonb,
    5);
