
-- Coach Category Permissions table
CREATE TABLE public.coach_category_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  category_id uuid NOT NULL REFERENCES public.coach_categories(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'approved',
  approved_by uuid,
  approved_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(coach_id, category_id)
);

-- Coach Category Requests table
CREATE TABLE public.coach_category_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  requested_category_id uuid NOT NULL REFERENCES public.coach_categories(id) ON DELETE CASCADE,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  admin_response_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(coach_id, requested_category_id, status)
);

-- Enable RLS
ALTER TABLE public.coach_category_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_category_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for coach_category_permissions
CREATE POLICY "Coaches can read own permissions" ON public.coach_category_permissions
  FOR SELECT TO authenticated
  USING (coach_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage permissions" ON public.coach_category_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS policies for coach_category_requests
CREATE POLICY "Coaches can read own requests" ON public.coach_category_requests
  FOR SELECT TO authenticated
  USING (coach_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches can insert own requests" ON public.coach_category_requests
  FOR INSERT TO authenticated
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Admins can manage requests" ON public.coach_category_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Migrate existing coaches: create permissions from their category_id
INSERT INTO public.coach_category_permissions (coach_id, category_id, is_primary, status, approved_at)
SELECT p.user_id, p.category_id, true, 'approved', now()
FROM public.profiles p
INNER JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.role = 'coach'
WHERE p.category_id IS NOT NULL
ON CONFLICT (coach_id, category_id) DO NOTHING;

-- Also add permissions for any categories used in existing courses not yet in permissions
INSERT INTO public.coach_category_permissions (coach_id, category_id, is_primary, status, approved_at)
SELECT DISTINCT c.coach_id, cc.id, false, 'approved', now()
FROM public.courses c
INNER JOIN public.coach_categories cc ON cc.name = c.category
WHERE cc.id IS NOT NULL
ON CONFLICT (coach_id, category_id) DO NOTHING;

-- Trigger to update updated_at
CREATE TRIGGER update_coach_category_permissions_updated_at
  BEFORE UPDATE ON public.coach_category_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coach_category_requests_updated_at
  BEFORE UPDATE ON public.coach_category_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
