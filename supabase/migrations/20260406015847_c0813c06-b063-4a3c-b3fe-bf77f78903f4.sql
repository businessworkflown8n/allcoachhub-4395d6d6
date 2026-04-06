
-- Thumbnail access table (same pattern as whatsapp_access / email_marketing_access)
CREATE TABLE public.thumbnail_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  granted_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(coach_id)
);

ALTER TABLE public.thumbnail_access ENABLE ROW LEVEL SECURITY;

-- Coaches can read their own access
CREATE POLICY "Coaches can view own thumbnail access"
  ON public.thumbnail_access FOR SELECT
  TO authenticated
  USING (coach_id = auth.uid());

-- Admins can manage all
CREATE POLICY "Admins can manage thumbnail access"
  ON public.thumbnail_access FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
