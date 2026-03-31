
ALTER TABLE public.coach_websites 
ADD COLUMN IF NOT EXISTS banner_urls text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS content_sections jsonb DEFAULT '{}';

COMMENT ON COLUMN public.coach_websites.banner_urls IS 'Up to 3 banner image URLs for hero slider';
COMMENT ON COLUMN public.coach_websites.content_sections IS 'Editable content for all website sections: stats, usps, testimonials, faqs, cta_text, etc.';
