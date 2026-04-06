
-- Learner notifications table
CREATE TABLE public.learner_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  coach_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.learner_notifications ENABLE ROW LEVEL SECURITY;

-- Learners can read their own notifications
CREATE POLICY "Learners can view own notifications"
  ON public.learner_notifications FOR SELECT
  TO authenticated
  USING (learner_id = auth.uid());

-- Learners can update (mark as read) their own notifications
CREATE POLICY "Learners can update own notifications"
  ON public.learner_notifications FOR UPDATE
  TO authenticated
  USING (learner_id = auth.uid())
  WITH CHECK (learner_id = auth.uid());

-- Learners can delete their own notifications
CREATE POLICY "Learners can delete own notifications"
  ON public.learner_notifications FOR DELETE
  TO authenticated
  USING (learner_id = auth.uid());

-- Service role / edge functions can insert notifications
CREATE POLICY "Service can insert notifications"
  ON public.learner_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_learner_notifications_learner_id ON public.learner_notifications (learner_id, created_at DESC);
CREATE INDEX idx_learner_notifications_unread ON public.learner_notifications (learner_id) WHERE is_read = false;
