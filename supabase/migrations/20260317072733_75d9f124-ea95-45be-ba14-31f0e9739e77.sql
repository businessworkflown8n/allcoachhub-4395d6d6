
-- Coupons table for coaches
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  code text NOT NULL,
  discount_percent numeric NOT NULL DEFAULT 10,
  expiry_date timestamptz,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  usage_count integer NOT NULL DEFAULT 0,
  max_uses integer,
  revenue_generated numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own coupons" ON public.coupons FOR ALL TO authenticated
  USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Admins can manage all coupons" ON public.coupons FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Program bundles table
CREATE TABLE public.program_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  bundle_price_usd numeric NOT NULL DEFAULT 0,
  bundle_price_inr numeric NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  sales_count integer NOT NULL DEFAULT 0,
  revenue_generated numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.program_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own bundles" ON public.program_bundles FOR ALL TO authenticated
  USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Admins can manage all bundles" ON public.program_bundles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view published bundles" ON public.program_bundles FOR SELECT TO public
  USING (is_published = true);

-- Bundle items (courses in a bundle)
CREATE TABLE public.bundle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES public.program_bundles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(bundle_id, course_id)
);

ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own bundle items" ON public.bundle_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.program_bundles pb WHERE pb.id = bundle_items.bundle_id AND pb.coach_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.program_bundles pb WHERE pb.id = bundle_items.bundle_id AND pb.coach_id = auth.uid()));

CREATE POLICY "Admins can manage all bundle items" ON public.bundle_items FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view published bundle items" ON public.bundle_items FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM public.program_bundles pb WHERE pb.id = bundle_items.bundle_id AND pb.is_published = true));
