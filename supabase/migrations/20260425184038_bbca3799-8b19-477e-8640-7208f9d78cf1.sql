-- 1. Add new isolated feature flag (defaults false — no impact on existing coaches)
ALTER TABLE public.coach_feature_flags
  ADD COLUMN IF NOT EXISTS external_materials_access BOOLEAN NOT NULL DEFAULT false;

-- 2. New isolated table for external-link-only materials
CREATE TABLE IF NOT EXISTS public.coach_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  external_link TEXT NOT NULL,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT coach_materials_https_only CHECK (external_link ~* '^https://'),
  CONSTRAINT coach_materials_status_check CHECK (status IN ('active', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_coach_materials_coach_id ON public.coach_materials(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_materials_status ON public.coach_materials(status);

-- 3. Enable RLS
ALTER TABLE public.coach_materials ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies
-- Coach: full CRUD on own materials
CREATE POLICY "Coaches can view their own materials"
  ON public.coach_materials FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can insert their own materials"
  ON public.coach_materials FOR INSERT
  WITH CHECK (auth.uid() = coach_id AND public.has_role(auth.uid(), 'coach'));

CREATE POLICY "Coaches can update their own materials"
  ON public.coach_materials FOR UPDATE
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete their own materials"
  ON public.coach_materials FOR DELETE
  USING (auth.uid() = coach_id);

-- Enrolled learners: view-only on active materials of coaches they are enrolled with
CREATE POLICY "Enrolled learners can view coach materials"
  ON public.coach_materials FOR SELECT
  USING (
    status = 'active'
    AND public.learner_enrolled_with_coach(auth.uid(), coach_id)
  );

-- Admin: full access
CREATE POLICY "Admins can manage all coach materials"
  ON public.coach_materials FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. updated_at trigger
CREATE TRIGGER update_coach_materials_updated_at
  BEFORE UPDATE ON public.coach_materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();