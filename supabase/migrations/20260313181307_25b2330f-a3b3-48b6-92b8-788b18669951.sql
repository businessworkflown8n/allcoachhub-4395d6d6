
ALTER TABLE public.webinar_registrations 
ADD COLUMN IF NOT EXISTS registrant_name text,
ADD COLUMN IF NOT EXISTS registrant_email text,
ADD COLUMN IF NOT EXISTS registrant_phone text;
