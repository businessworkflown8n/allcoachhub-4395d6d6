
-- Add CRM fields to profiles table for marketing/segmentation
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone DEFAULT now();
