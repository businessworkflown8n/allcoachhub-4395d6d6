
ALTER TABLE public.ai_blogs 
  ADD COLUMN IF NOT EXISTS blog_type text NOT NULL DEFAULT 'article',
  ADD COLUMN IF NOT EXISTS job_data jsonb;
