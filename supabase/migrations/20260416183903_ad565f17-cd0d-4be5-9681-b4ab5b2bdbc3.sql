-- 1. Global notification settings (singleton row keyed by 'global')
CREATE TABLE public.notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

INSERT INTO public.notification_settings (key, enabled) VALUES ('global_notifications_enabled', true);
INSERT INTO public.notification_settings (key, enabled) VALUES ('coach_notifications_enabled', true);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view notification settings"
ON public.notification_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update notification settings"
ON public.notification_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Per-coach permission to submit notification requests
CREATE TABLE public.coach_notification_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL UNIQUE,
  can_submit boolean NOT NULL DEFAULT true,
  is_blocked boolean NOT NULL DEFAULT false,
  notes text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_notification_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coach can view own permission"
ON public.coach_notification_permissions FOR SELECT TO authenticated
USING (coach_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage coach permissions"
ON public.coach_notification_permissions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Notification requests (the moderation queue)
CREATE TABLE public.notification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by uuid NOT NULL,
  submitter_role text NOT NULL DEFAULT 'coach', -- 'coach' | 'admin'
  audience_type text NOT NULL DEFAULT 'all_learners', -- 'all_learners' | 'course' | 'segment'
  course_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  cta_link text,
  scheduled_for timestamptz,
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'sent' | 'cancelled'
  reviewer_id uuid,
  reviewer_note text,
  reviewed_at timestamptz,
  sent_at timestamptz,
  recipients_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_req_status ON public.notification_requests(status, created_at DESC);
CREATE INDEX idx_notif_req_submitter ON public.notification_requests(submitted_by, created_at DESC);

ALTER TABLE public.notification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches view own requests"
ON public.notification_requests FOR SELECT TO authenticated
USING (submitted_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches create own requests"
ON public.notification_requests FOR INSERT TO authenticated
WITH CHECK (
  submitted_by = auth.uid()
  AND (
    public.has_role(auth.uid(), 'admin')
    OR (
      public.has_role(auth.uid(), 'coach')
      AND EXISTS (SELECT 1 FROM public.notification_settings WHERE key = 'global_notifications_enabled' AND enabled = true)
      AND EXISTS (SELECT 1 FROM public.notification_settings WHERE key = 'coach_notifications_enabled' AND enabled = true)
      AND NOT EXISTS (SELECT 1 FROM public.coach_notification_permissions WHERE coach_id = auth.uid() AND is_blocked = true)
    )
  )
);

CREATE POLICY "Coaches cancel own pending requests"
ON public.notification_requests FOR UPDATE TO authenticated
USING (
  (submitted_by = auth.uid() AND status = 'pending')
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  (submitted_by = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins delete requests"
ON public.notification_requests FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_notification_requests_updated_at
BEFORE UPDATE ON public.notification_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Add tracking columns to learner_notifications for analytics
ALTER TABLE public.learner_notifications
  ADD COLUMN IF NOT EXISTS request_id uuid REFERENCES public.notification_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cta_link text,
  ADD COLUMN IF NOT EXISTS opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS clicked_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_learner_notif_request ON public.learner_notifications(request_id);

-- 5. Function: admin approves a request → fans out to learner_notifications and marks sent
CREATE OR REPLACE FUNCTION public.approve_notification_request(_request_id uuid, _reviewer_note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req public.notification_requests%ROWTYPE;
  inserted_count integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve notification requests';
  END IF;

  SELECT * INTO req FROM public.notification_requests WHERE id = _request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF req.status NOT IN ('pending') THEN RAISE EXCEPTION 'Only pending requests can be approved'; END IF;

  -- Fan out to all learners (or course-enrolled learners)
  IF req.audience_type = 'course' AND req.course_id IS NOT NULL THEN
    INSERT INTO public.learner_notifications (learner_id, title, message, coach_id, cta_link, request_id)
    SELECT DISTINCT e.user_id, req.title, req.message, req.submitted_by, req.cta_link, req.id
    FROM public.enrollments e
    WHERE e.course_id = req.course_id;
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
  ELSE
    -- all_learners
    INSERT INTO public.learner_notifications (learner_id, title, message, coach_id, cta_link, request_id)
    SELECT ur.user_id, req.title, req.message, req.submitted_by, req.cta_link, req.id
    FROM public.user_roles ur
    WHERE ur.role = 'learner';
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
  END IF;

  UPDATE public.notification_requests
  SET status = 'sent',
      reviewer_id = auth.uid(),
      reviewer_note = COALESCE(_reviewer_note, reviewer_note),
      reviewed_at = now(),
      sent_at = now(),
      recipients_count = inserted_count
  WHERE id = _request_id;

  RETURN jsonb_build_object('success', true, 'recipients', inserted_count);
END;
$$;

-- 6. Function: admin rejects a request
CREATE OR REPLACE FUNCTION public.reject_notification_request(_request_id uuid, _reviewer_note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can reject notification requests';
  END IF;

  UPDATE public.notification_requests
  SET status = 'rejected',
      reviewer_id = auth.uid(),
      reviewer_note = _reviewer_note,
      reviewed_at = now()
  WHERE id = _request_id AND status = 'pending';

  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found or not pending'; END IF;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 7. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_requests;