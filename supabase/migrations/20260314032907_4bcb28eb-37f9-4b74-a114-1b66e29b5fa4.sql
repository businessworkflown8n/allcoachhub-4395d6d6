
-- Materials table
CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE,
  description text,
  category text NOT NULL DEFAULT 'General',
  thumbnail_url text,
  file_url text,
  file_type text DEFAULT 'pdf',
  is_published boolean NOT NULL DEFAULT true,
  is_downloadable boolean NOT NULL DEFAULT true,
  is_email_shareable boolean NOT NULL DEFAULT true,
  view_count integer NOT NULL DEFAULT 0,
  download_count integer NOT NULL DEFAULT 0,
  email_share_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Anyone logged in can view published materials
CREATE POLICY "Authenticated users can view published materials"
ON public.materials FOR SELECT TO authenticated
USING (is_published = true);

-- Admins can do everything
CREATE POLICY "Admins can manage materials"
ON public.materials FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Slug generation trigger
CREATE OR REPLACE FUNCTION public.generate_material_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE
  base_slug text;
  new_slug text;
  counter integer := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug != '' THEN RETURN NEW; END IF;
  IF NEW.title IS NULL OR NEW.title = '' THEN RETURN NEW; END IF;
  base_slug := lower(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  base_slug := left(base_slug, 80);
  new_slug := base_slug;
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.materials WHERE slug = new_slug AND id != NEW.id) THEN EXIT; END IF;
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  NEW.slug := new_slug;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_material_slug
BEFORE INSERT OR UPDATE ON public.materials
FOR EACH ROW EXECUTE FUNCTION public.generate_material_slug();

-- Updated_at trigger
CREATE TRIGGER update_materials_updated_at
BEFORE UPDATE ON public.materials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Platform settings for materials toggles (materials_page_enabled, materials_download_enabled, materials_email_share_enabled)
INSERT INTO public.platform_settings (key, value) VALUES
  ('materials_page_enabled', 'true'),
  ('materials_download_enabled', 'true'),
  ('materials_email_share_enabled', 'true')
ON CONFLICT DO NOTHING;

-- Storage bucket for material files
INSERT INTO storage.buckets (id, name, public) VALUES ('materials', 'materials', true);

-- Storage policies for materials bucket
CREATE POLICY "Anyone can view material files"
ON storage.objects FOR SELECT
USING (bucket_id = 'materials');

CREATE POLICY "Admins can upload material files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'materials' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete material files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'materials' AND has_role(auth.uid(), 'admin'::app_role));
