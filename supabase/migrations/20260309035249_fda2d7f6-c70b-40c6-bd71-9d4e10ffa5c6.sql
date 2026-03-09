
-- Social posts table for content library and sharing
CREATE TABLE public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  content text NOT NULL,
  image_url text,
  video_url text,
  link_url text,
  hashtags text[] DEFAULT '{}',
  platforms text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamp with time zone,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- Users can manage their own posts
CREATE POLICY "Users can manage own social posts" ON public.social_posts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all posts
CREATE POLICY "Admins can manage all social posts" ON public.social_posts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
