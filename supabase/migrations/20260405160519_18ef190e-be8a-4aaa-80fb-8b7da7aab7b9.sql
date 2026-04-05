
ALTER TABLE public.courses 
  ADD COLUMN IF NOT EXISTS category_request_id uuid REFERENCES public.coach_category_requests(id) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS requires_category_approval boolean NOT NULL DEFAULT false;
