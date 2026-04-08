
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  service_type text NOT NULL DEFAULT 'one_on_one',
  duration_minutes integer NOT NULL DEFAULT 60,
  price_usd numeric NOT NULL DEFAULT 0,
  price_inr numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  booking_url text,
  is_active boolean NOT NULL DEFAULT true,
  is_published boolean NOT NULL DEFAULT false,
  max_bookings_per_day integer DEFAULT 5,
  availability_schedule jsonb,
  thumbnail_url text,
  category text,
  tags text[],
  total_bookings integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_type text NOT NULL DEFAULT 'video',
  content_url text,
  content_text text,
  duration_minutes integer DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  is_free_preview boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.course_lessons(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  pass_percentage integer NOT NULL DEFAULT 70,
  time_limit_minutes integer,
  max_attempts integer DEFAULT 3,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'multiple_choice',
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer text NOT NULL,
  points integer NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 0,
  total_points integer NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.course_modules(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  due_days integer,
  max_score integer NOT NULL DEFAULT 100,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  submission_url text,
  submission_text text,
  score integer,
  feedback text,
  status text NOT NULL DEFAULT 'submitted',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  graded_at timestamptz
);

CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  price_monthly_usd numeric NOT NULL DEFAULT 0,
  price_monthly_inr numeric NOT NULL DEFAULT 0,
  price_yearly_usd numeric,
  price_yearly_inr numeric,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  max_members integer,
  current_members integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.membership_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id uuid NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  template_design jsonb NOT NULL DEFAULT '{}'::jsonb,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.issued_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.certificate_templates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  certificate_number text NOT NULL UNIQUE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  pdf_url text,
  is_valid boolean NOT NULL DEFAULT true
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  subject text,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  parent_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  coach_id uuid,
  type text NOT NULL DEFAULT 'purchase',
  reference_type text,
  reference_id uuid,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  platform_fee numeric NOT NULL DEFAULT 0,
  coach_earnings numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed',
  payment_method text,
  payment_gateway_id text,
  refund_reason text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  meta_title text,
  meta_description text,
  is_published boolean NOT NULL DEFAULT false,
  views integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  coach_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewer_id uuid,
  reviewer_comment text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.moderation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  reason text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid,
  name text NOT NULL,
  trigger_event text NOT NULL,
  trigger_conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  action_type text NOT NULL,
  action_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  last_triggered_at timestamptz,
  trigger_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  user_id uuid,
  coach_id uuid,
  entity_type text,
  entity_id uuid,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  session_id text,
  page_url text,
  referrer text,
  device_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  resource text NOT NULL,
  action text NOT NULL,
  is_allowed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role, resource, action)
);

-- updated_at triggers
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_modules_updated_at BEFORE UPDATE ON public.course_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_lessons_updated_at BEFORE UPDATE ON public.course_lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_membership_subs_updated_at BEFORE UPDATE ON public.membership_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certificate_templates_updated_at BEFORE UPDATE ON public.certificate_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_landing_pages_updated_at BEFORE UPDATE ON public.landing_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON public.automation_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
