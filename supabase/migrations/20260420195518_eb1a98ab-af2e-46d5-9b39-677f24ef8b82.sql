
-- ============ FEATURE FLAGS ============
ALTER TABLE public.coach_feature_flags
  ADD COLUMN IF NOT EXISTS crm_access boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS leads_access boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sessions_access boolean NOT NULL DEFAULT false;

-- ============ COACH CLIENTS (1:1 / unified CRM) ============
CREATE TABLE IF NOT EXISTS public.coach_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, paused, churned, prospect
  source TEXT, -- manual, enrollment, referral, website
  goals TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  health_score INTEGER DEFAULT 75,
  lifetime_value NUMERIC DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_coach_clients_coach ON public.coach_clients(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_clients_status ON public.coach_clients(status);

ALTER TABLE public.coach_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own clients" ON public.coach_clients
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Admins view all clients" ON public.coach_clients
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_coach_clients_updated_at
  BEFORE UPDATE ON public.coach_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ COACH LEADS (Pipeline) ============
CREATE TABLE IF NOT EXISTS public.coach_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  stage TEXT NOT NULL DEFAULT 'new', -- new, contacted, call_booked, proposal_sent, converted, lost
  source TEXT, -- website, referral, ads, organic, manual
  estimated_value NUMERIC DEFAULT 0,
  notes TEXT,
  next_action TEXT,
  next_action_at TIMESTAMPTZ,
  converted_client_id UUID REFERENCES public.coach_clients(id) ON DELETE SET NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_coach_leads_coach ON public.coach_leads(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_leads_stage ON public.coach_leads(stage);

ALTER TABLE public.coach_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own leads" ON public.coach_leads
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Admins view all leads" ON public.coach_leads
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_coach_leads_updated_at
  BEFORE UPDATE ON public.coach_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ COACH SESSIONS ============
CREATE TABLE IF NOT EXISTS public.coach_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  client_id UUID REFERENCES public.coach_clients(id) ON DELETE SET NULL,
  client_name TEXT,
  title TEXT NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'one_on_one', -- one_on_one, group, workshop, discovery
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  meeting_url TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  agenda TEXT,
  outcome TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_coach_sessions_coach ON public.coach_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_sessions_scheduled ON public.coach_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_coach_sessions_status ON public.coach_sessions(status);

ALTER TABLE public.coach_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own sessions" ON public.coach_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Admins view all sessions" ON public.coach_sessions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_coach_sessions_updated_at
  BEFORE UPDATE ON public.coach_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SESSION NOTES ============
CREATE TABLE IF NOT EXISTS public.coach_session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.coach_sessions(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL,
  summary TEXT,
  action_items JSONB DEFAULT '[]'::jsonb,
  private_notes TEXT,
  client_visible BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_session_notes_session ON public.coach_session_notes(session_id);

ALTER TABLE public.coach_session_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own session notes" ON public.coach_session_notes
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Admins view all session notes" ON public.coach_session_notes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_session_notes_updated_at
  BEFORE UPDATE ON public.coach_session_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ UPDATE BUNDLE DEFAULTS ============
UPDATE public.feature_bundles
SET feature_flags = feature_flags || jsonb_build_object(
  'crm_access', CASE WHEN slug IN ('pro','premium','corporate') THEN true ELSE false END,
  'leads_access', CASE WHEN slug IN ('starter','pro','premium','corporate') THEN true ELSE false END,
  'sessions_access', CASE WHEN slug IN ('pro','premium','corporate') THEN true ELSE false END
)
WHERE slug IN ('free','starter','pro','premium','corporate');
