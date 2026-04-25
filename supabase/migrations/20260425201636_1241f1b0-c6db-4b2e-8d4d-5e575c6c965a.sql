
-- Config table (single row)
CREATE TABLE public.inactive_reminder_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean NOT NULL DEFAULT false,
  user_type text NOT NULL DEFAULT 'all' CHECK (user_type IN ('all','coach','learner')),
  inactivity_days integer NOT NULL DEFAULT 7 CHECK (inactivity_days BETWEEN 1 AND 90),
  frequency_type text NOT NULL DEFAULT 'once' CHECK (frequency_type IN ('once','repeat')),
  repeat_interval_days integer NOT NULL DEFAULT 7 CHECK (repeat_interval_days BETWEEN 1 AND 90),
  email_subject text NOT NULL DEFAULT 'We Miss You at AI Coach Portal 🚀',
  email_body text NOT NULL DEFAULT 'Hi {{UserName}},

We noticed you haven''t logged in since {{LastLoginDate}}.
You''ve been inactive for {{DaysInactive}} days.

There are new updates, learning materials, and opportunities waiting for you.

Click the button below to continue your journey.

Stay consistent. Stay ahead.

– Team AI Coach Portal',
  cta_text text NOT NULL DEFAULT 'Login Now',
  cta_url text NOT NULL DEFAULT '/login',
  cta_new_tab boolean NOT NULL DEFAULT true,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inactive_reminder_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage inactive reminder config"
  ON public.inactive_reminder_config FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_inactive_reminder_config_updated
  BEFORE UPDATE ON public.inactive_reminder_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Per-user tracking
CREATE TABLE public.inactive_user_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  last_login_date timestamptz,
  last_email_sent_date timestamptz,
  email_sent_flag boolean NOT NULL DEFAULT false,
  reminder_cycle_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inactive_tracking_last_email ON public.inactive_user_tracking(last_email_sent_date);
CREATE INDEX idx_inactive_tracking_user ON public.inactive_user_tracking(user_id);

ALTER TABLE public.inactive_user_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read inactive tracking"
  ON public.inactive_user_tracking FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_inactive_user_tracking_updated
  BEFORE UPDATE ON public.inactive_user_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Logs (append-only)
CREATE TABLE public.inactive_reminder_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent','failed','test')),
  error_message text,
  cycle_count integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inactive_logs_created ON public.inactive_reminder_logs(created_at DESC);
CREATE INDEX idx_inactive_logs_user ON public.inactive_reminder_logs(user_id);

ALTER TABLE public.inactive_reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read inactive reminder logs"
  ON public.inactive_reminder_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed default config row
INSERT INTO public.inactive_reminder_config (is_enabled) VALUES (false);
