
-- Add missing columns to reviews
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS review_text TEXT;

-- Migrate existing data: is_approved=true → approved, false → pending
UPDATE public.reviews SET status = CASE WHEN is_approved = true THEN 'approved' ELSE 'pending' END;

-- Create review_replies table
CREATE TABLE public.review_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL,
  reply_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

-- Validate rating trigger
CREATE OR REPLACE FUNCTION public.validate_review_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  IF NEW.status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid review status';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_review_before_upsert
BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.validate_review_rating();

-- Reviews RLS policies
CREATE POLICY "Anyone can read approved reviews"
ON public.reviews FOR SELECT
USING (status = 'approved');

CREATE POLICY "Learners view own reviews"
ON public.reviews FOR SELECT
TO authenticated
USING (auth.uid() = learner_id);

CREATE POLICY "Admins view all reviews"
ON public.reviews FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Learners create reviews"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = learner_id);

CREATE POLICY "Learners update own reviews"
ON public.reviews FOR UPDATE
TO authenticated
USING (auth.uid() = learner_id);

CREATE POLICY "Learners delete own reviews"
ON public.reviews FOR DELETE
TO authenticated
USING (auth.uid() = learner_id);

CREATE POLICY "Admins update any review"
ON public.reviews FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete any review"
ON public.reviews FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Review replies RLS
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read replies on approved reviews"
ON public.review_replies FOR SELECT
USING (EXISTS (SELECT 1 FROM public.reviews WHERE id = review_id AND status = 'approved'));

CREATE POLICY "Coaches reply to own reviews"
ON public.review_replies FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Admins manage replies"
ON public.review_replies FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_coach_id ON public.reviews(coach_id);
CREATE INDEX IF NOT EXISTS idx_reviews_learner_id ON public.reviews(learner_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_review_replies_review_id ON public.review_replies(review_id);
