
-- ===== FEATURE FLAGS =====
ALTER TABLE public.coach_feature_flags
  ADD COLUMN IF NOT EXISTS progress_access boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS packages_access boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS automations_access boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS copilot_access boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS content_studio_access boolean NOT NULL DEFAULT false;

-- ===== CLIENT GOALS =====
CREATE TABLE IF NOT EXISTS public.client_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  client_id UUID REFERENCES public.coach_clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, paused, abandoned
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_client_goals_coach ON public.client_goals(coach_id);
CREATE INDEX IF NOT EXISTS idx_client_goals_client ON public.client_goals(client_id);
ALTER TABLE public.client_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches manage own goals" ON public.client_goals
  FOR ALL TO authenticated USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Admins view all goals" ON public.client_goals
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_client_goals_updated_at BEFORE UPDATE ON public.client_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== CLIENT CHECK-INS =====
CREATE TABLE IF NOT EXISTS public.client_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES public.coach_clients(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood_score INTEGER, -- 1-10
  energy_score INTEGER, -- 1-10
  habits_completed JSONB DEFAULT '[]'::jsonb,
  reflection TEXT,
  blockers TEXT,
  wins TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_check_ins_client ON public.client_check_ins(client_id);
ALTER TABLE public.client_check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches manage own check-ins" ON public.client_check_ins
  FOR ALL TO authenticated USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Admins view all check-ins" ON public.client_check_ins
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ===== COACH PACKAGES =====
CREATE TABLE IF NOT EXISTS public.coach_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  package_type TEXT NOT NULL DEFAULT 'one_on_one', -- one_on_one, group, membership, workshop, digital
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  billing_interval TEXT DEFAULT 'one_time', -- one_time, monthly, yearly
  sessions_included INTEGER,
  duration_weeks INTEGER,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_coach_packages_coach ON public.coach_packages(coach_id);
ALTER TABLE public.coach_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches manage own packages" ON public.coach_packages
  FOR ALL TO authenticated USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Active packages public" ON public.coach_packages
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE TRIGGER trg_packages_updated_at BEFORE UPDATE ON public.coach_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== AUTOMATIONS =====
CREATE TABLE IF NOT EXISTS public.coach_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- missed_session, inactive_client, renewal_due, lead_followup, weekly_reflection, homework_reminder
  channel TEXT NOT NULL DEFAULT 'email', -- email, whatsapp, in_app
  message_template TEXT NOT NULL,
  delay_hours INTEGER DEFAULT 24,
  is_active BOOLEAN NOT NULL DEFAULT true,
  trigger_count INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_automations_coach ON public.coach_automations(coach_id);
ALTER TABLE public.coach_automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches manage own automations" ON public.coach_automations
  FOR ALL TO authenticated USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Admins view all automations" ON public.coach_automations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_automations_updated_at BEFORE UPDATE ON public.coach_automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== CONTENT ASSETS =====
CREATE TABLE IF NOT EXISTS public.coach_content_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  source_session_id UUID REFERENCES public.coach_sessions(id) ON DELETE SET NULL,
  asset_type TEXT NOT NULL, -- social_post, email, blog, worksheet, lesson_summary
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  prompt_used TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_content_assets_coach ON public.coach_content_assets(coach_id);
ALTER TABLE public.coach_content_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches manage own content" ON public.coach_content_assets
  FOR ALL TO authenticated USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Admins view all content" ON public.coach_content_assets
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_content_assets_updated_at BEFORE UPDATE ON public.coach_content_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== UPDATE BUNDLE DEFAULTS =====
UPDATE public.feature_bundles
SET feature_flags = feature_flags || jsonb_build_object(
  'progress_access',       CASE WHEN slug IN ('pro','premium','corporate') THEN true ELSE false END,
  'packages_access',       CASE WHEN slug IN ('starter','pro','premium','corporate') THEN true ELSE false END,
  'automations_access',    CASE WHEN slug IN ('pro','premium','corporate') THEN true ELSE false END,
  'copilot_access',        CASE WHEN slug IN ('premium','corporate') THEN true ELSE false END,
  'content_studio_access', CASE WHEN slug IN ('pro','premium','corporate') THEN true ELSE false END
)
WHERE slug IN ('free','starter','pro','premium','corporate');
