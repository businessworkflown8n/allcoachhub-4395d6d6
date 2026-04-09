
-- Coach feature flags table
CREATE TABLE public.coach_feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL UNIQUE,
  workshops_access BOOLEAN NOT NULL DEFAULT false,
  courses_access BOOLEAN NOT NULL DEFAULT false,
  feed_access BOOLEAN NOT NULL DEFAULT false,
  messaging_access BOOLEAN NOT NULL DEFAULT false,
  paid_content_access BOOLEAN NOT NULL DEFAULT false,
  contact_access BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_feature_flags ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access on coach_feature_flags"
  ON public.coach_feature_flags FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Coaches can read their own flags
CREATE POLICY "Coaches can view own feature flags"
  ON public.coach_feature_flags FOR SELECT
  TO authenticated
  USING (auth.uid() = coach_id);

-- Auto-create feature flags row when a coach role is assigned
CREATE OR REPLACE FUNCTION public.auto_create_feature_flags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'coach' THEN
    INSERT INTO public.coach_feature_flags (coach_id)
    VALUES (NEW.user_id)
    ON CONFLICT (coach_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_create_feature_flags
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_feature_flags();

-- Updated_at trigger
CREATE TRIGGER update_coach_feature_flags_updated_at
  BEFORE UPDATE ON public.coach_feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
