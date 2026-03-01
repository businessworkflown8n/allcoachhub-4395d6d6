
CREATE TABLE public.ai_blogs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  excerpt text NOT NULL,
  content text,
  category text NOT NULL DEFAULT 'AI Trends',
  image_url text,
  read_time text NOT NULL DEFAULT '5 min read',
  published_at timestamp with time zone NOT NULL DEFAULT now(),
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published blogs" ON public.ai_blogs
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage blogs" ON public.ai_blogs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
