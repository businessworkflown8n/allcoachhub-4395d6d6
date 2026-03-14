
-- Material download log for source tracking and deduplication
CREATE TABLE public.material_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  user_id uuid,
  source text NOT NULL DEFAULT 'public_materials',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.material_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert downloads" ON public.material_downloads
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Admins can view all downloads" ON public.material_downloads
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Add copy_link_clicks and share_count to materials
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS copy_link_clicks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_count integer NOT NULL DEFAULT 0;

-- Index for analytics queries
CREATE INDEX idx_material_downloads_material_id ON public.material_downloads(material_id);
CREATE INDEX idx_material_downloads_source ON public.material_downloads(source);
