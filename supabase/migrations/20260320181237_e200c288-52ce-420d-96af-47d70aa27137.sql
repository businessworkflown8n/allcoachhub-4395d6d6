
ALTER TABLE public.materials 
  ADD COLUMN IF NOT EXISTS resource_type text NOT NULL DEFAULT 'file',
  ADD COLUMN IF NOT EXISTS external_url text DEFAULT NULL;
