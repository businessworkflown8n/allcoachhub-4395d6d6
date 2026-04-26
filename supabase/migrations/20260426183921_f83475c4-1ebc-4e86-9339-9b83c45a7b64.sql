-- Isolated table to capture full signup form payloads (email signup only)
CREATE TABLE IF NOT EXISTS public.signup_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('coach', 'learner')),
  signup_method TEXT NOT NULL DEFAULT 'email',
  email TEXT NOT NULL,
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  field_count INTEGER NOT NULL DEFAULT 0,
  source_url TEXT NULL,
  utm_source TEXT NULL,
  utm_medium TEXT NULL,
  utm_campaign TEXT NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signup_submissions_email ON public.signup_submissions(email);
CREATE INDEX IF NOT EXISTS idx_signup_submissions_user_id ON public.signup_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_signup_submissions_created_at ON public.signup_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signup_submissions_user_type ON public.signup_submissions(user_type);

ALTER TABLE public.signup_submissions ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anonymous & authenticated clients (signup happens before session is fully ready)
CREATE POLICY "Anyone can record their signup submission"
  ON public.signup_submissions
  FOR INSERT
  WITH CHECK (signup_method = 'email');

-- Only admins can read submissions
CREATE POLICY "Admins can view all signup submissions"
  ON public.signup_submissions
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete signup submissions"
  ON public.signup_submissions
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));