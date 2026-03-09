ALTER TABLE public.ai_blogs ADD COLUMN IF NOT EXISTS cta_text text DEFAULT NULL;
ALTER TABLE public.ai_blogs ADD COLUMN IF NOT EXISTS cta_link text DEFAULT NULL;
ALTER TABLE public.ai_blogs ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[];