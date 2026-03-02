ALTER TABLE public.webinars ADD COLUMN webinar_link_status text NOT NULL DEFAULT 'pending';

-- Update existing webinars to approved so they aren't broken
UPDATE public.webinars SET webinar_link_status = 'approved';