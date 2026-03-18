
-- Add email column to material_downloads for guest tracking
ALTER TABLE public.material_downloads ADD COLUMN IF NOT EXISTS email text;

-- Create material_links table for shareable token-based URLs
CREATE TABLE public.material_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  expiry_date timestamp with time zone,
  click_count integer NOT NULL DEFAULT 0,
  download_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.material_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage material links"
  ON public.material_links FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read active links by token"
  ON public.material_links FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Anyone can update link click counts"
  ON public.material_links FOR UPDATE
  TO public
  USING (is_active = true)
  WITH CHECK (is_active = true);
