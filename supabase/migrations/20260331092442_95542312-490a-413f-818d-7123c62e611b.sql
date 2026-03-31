
-- Coach Websites table
CREATE TABLE public.coach_websites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  institute_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  tagline text,
  description text,
  logo_url text,
  banner_url text,
  theme_color text DEFAULT '#6366f1',
  video_url text,
  about_text text,
  social_links jsonb DEFAULT '{}',
  contact_info jsonb DEFAULT '{}',
  show_courses boolean DEFAULT true,
  show_testimonials boolean DEFAULT false,
  show_about boolean DEFAULT true,
  show_contact boolean DEFAULT false,
  show_video boolean DEFAULT false,
  show_gallery boolean DEFAULT false,
  gallery_images text[] DEFAULT '{}',
  meta_title text,
  meta_description text,
  status text NOT NULL DEFAULT 'draft',
  is_live boolean NOT NULL DEFAULT false,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_websites ENABLE ROW LEVEL SECURITY;

-- RLS: coaches can manage their own website
CREATE POLICY "Coaches can manage own website"
  ON public.coach_websites FOR ALL TO authenticated
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- RLS: admins can manage all
CREATE POLICY "Admins can manage all websites"
  ON public.coach_websites FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: anyone can view live approved websites
CREATE POLICY "Anyone can view live websites"
  ON public.coach_websites FOR SELECT TO public
  USING (status = 'approved' AND is_live = true);
