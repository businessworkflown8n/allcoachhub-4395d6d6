
CREATE TABLE public.contact_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  user_id uuid NOT NULL,
  user_type text NOT NULL DEFAULT 'learner',
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(coach_id, user_id, user_type)
);

ALTER TABLE public.contact_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all requests" ON public.contact_access_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches can view own requests" ON public.contact_access_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can create requests" ON public.contact_access_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = coach_id);
