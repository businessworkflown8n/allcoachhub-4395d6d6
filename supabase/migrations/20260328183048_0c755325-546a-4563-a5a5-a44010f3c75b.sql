
CREATE TABLE public.email_marketing_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  granted_by UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(coach_id)
);

ALTER TABLE public.email_marketing_access ENABLE ROW LEVEL SECURITY;

-- Admins can manage all access records
CREATE POLICY "Admins can manage email marketing access"
ON public.email_marketing_access
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Coaches can read their own access record
CREATE POLICY "Coaches can read own access"
ON public.email_marketing_access
FOR SELECT
TO authenticated
USING (coach_id = auth.uid());
