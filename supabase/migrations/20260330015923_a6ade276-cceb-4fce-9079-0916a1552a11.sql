
-- Create coach_categories table
CREATE TABLE public.coach_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text DEFAULT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coach_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read active categories (for signup dropdown)
CREATE POLICY "Anyone can read active categories"
ON public.coach_categories FOR SELECT TO public
USING (is_active = true);

-- Admins can manage all categories
CREATE POLICY "Admins can manage all categories"
ON public.coach_categories FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add category_id column to profiles
ALTER TABLE public.profiles ADD COLUMN category_id uuid REFERENCES public.coach_categories(id) DEFAULT NULL;

-- Seed default categories
INSERT INTO public.coach_categories (name, slug, sort_order) VALUES
  ('Career', 'career', 1),
  ('Coding', 'coding', 2),
  ('Wellness', 'wellness', 3),
  ('Finance', 'finance', 4),
  ('Language', 'language', 5),
  ('Business', 'business', 6),
  ('Creative', 'creative', 7),
  ('Music', 'music', 8),
  ('Design', 'design', 9),
  ('Marketing', 'marketing', 10),
  ('Leadership', 'leadership', 11),
  ('Sales', 'sales', 12),
  ('Public Speaking', 'public-speaking', 13),
  ('Parenting', 'parenting', 14),
  ('Math & Science', 'math-science', 15),
  ('Mental Health', 'mental-health', 16),
  ('Productivity', 'productivity', 17),
  ('Photography', 'photography', 18),
  ('Spirituality', 'spirituality', 19),
  ('Legal', 'legal', 20),
  ('Others', 'others', 21);

-- Update trigger for updated_at
CREATE TRIGGER update_coach_categories_updated_at
  BEFORE UPDATE ON public.coach_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
