-- Add blueprint feature access flag
ALTER TABLE public.coach_feature_flags
  ADD COLUMN IF NOT EXISTS blueprint_access boolean NOT NULL DEFAULT true;

-- Coach blueprints (one per coach, auto-saved)
CREATE TABLE IF NOT EXISTS public.coach_blueprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL UNIQUE,
  current_step integer NOT NULL DEFAULT 1,
  completed_steps integer[] NOT NULL DEFAULT '{}',
  -- Step 1: Niche Clarity
  niche_inputs jsonb DEFAULT '{}'::jsonb,
  niche_output jsonb DEFAULT '{}'::jsonb,
  niche_score integer,
  -- Step 2: Avatar
  avatar_inputs jsonb DEFAULT '{}'::jsonb,
  avatar_output jsonb DEFAULT '{}'::jsonb,
  -- Step 3: Problems
  problems_output jsonb DEFAULT '[]'::jsonb,
  -- Step 4: Offer
  offer_inputs jsonb DEFAULT '{}'::jsonb,
  offer_output jsonb DEFAULT '{}'::jsonb,
  offer_score integer,
  -- Step 5: Pricing
  pricing_inputs jsonb DEFAULT '{}'::jsonb,
  pricing_output jsonb DEFAULT '{}'::jsonb,
  pricing_score integer,
  -- Step 6: Curriculum
  curriculum_output jsonb DEFAULT '{}'::jsonb,
  -- Step 7: Funnel
  funnel_output jsonb DEFAULT '{}'::jsonb,
  -- Step 8: Roadmap
  roadmap_output jsonb DEFAULT '{}'::jsonb,
  -- Step 9: Dashboard tracking
  dashboard_state jsonb DEFAULT '{}'::jsonb,
  -- Step 10: Certificate
  certificate_url text,
  blueprint_pdf_url text,
  share_slug text UNIQUE,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_blueprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own blueprint"
  ON public.coach_blueprints FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Admins view all blueprints"
  ON public.coach_blueprints FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public view shared blueprints"
  ON public.coach_blueprints FOR SELECT
  USING (share_slug IS NOT NULL AND is_completed = true);

CREATE TRIGGER tg_coach_blueprints_updated_at
  BEFORE UPDATE ON public.coach_blueprints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Chat messages with AI assistant (per coach, context-aware)
CREATE TABLE IF NOT EXISTS public.blueprint_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  step_context integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bp_chat_coach ON public.blueprint_chat_messages(coach_id, created_at);

ALTER TABLE public.blueprint_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own chat"
  ON public.blueprint_chat_messages FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Admins view chat"
  ON public.blueprint_chat_messages FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));