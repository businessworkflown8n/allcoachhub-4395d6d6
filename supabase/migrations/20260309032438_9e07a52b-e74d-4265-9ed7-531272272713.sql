-- Email contacts table for uploaded databases
CREATE TABLE public.email_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text NOT NULL,
  phone text,
  country text,
  user_type text,
  course_enrolled text,
  signup_date timestamp with time zone,
  source text DEFAULT 'upload',
  is_unsubscribed boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Unique constraint on email to prevent duplicates
CREATE UNIQUE INDEX email_contacts_email_unique ON public.email_contacts (email);

ALTER TABLE public.email_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email contacts"
  ON public.email_contacts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Email campaigns table
CREATE TABLE public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  sender_name text DEFAULT 'AI Coach Portal',
  sender_email text DEFAULT 'hello@aicoachportal.com',
  content text NOT NULL,
  cta_text text,
  cta_link text,
  audience_type text NOT NULL DEFAULT 'all',
  audience_filter jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  template_name text,
  scheduled_at timestamp with time zone,
  sent_at timestamp with time zone,
  total_recipients integer DEFAULT 0,
  total_sent integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email campaigns"
  ON public.email_campaigns FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Email templates table
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  cta_text text,
  cta_link text,
  category text DEFAULT 'general',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email templates"
  ON public.email_templates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Insert default templates
INSERT INTO public.email_templates (name, subject, content, cta_text, cta_link, category) VALUES
('Webinar Invitation', 'You''re Invited: {webinar_title}', E'Hello {Name},\n\nWe''re excited to invite you to our upcoming AI webinar!\n\n**{webinar_title}**\n\nDon''t miss this opportunity to learn from industry experts.\n\nBest regards,\nAI Coach Portal Team', 'Register for Webinar', '/webinars', 'webinar'),
('Course Promotion', 'New Course Alert: {course_title}', E'Hello {Name},\n\nWe just launched an exciting new course that we think you''ll love!\n\n**{course_title}**\n\nStart your AI learning journey today.\n\nBest regards,\nAI Coach Portal Team', 'Explore Courses', '/courses', 'course'),
('AI Blog Update', 'Latest AI Insights for You', E'Hello {Name},\n\nCheck out our latest AI articles and stay ahead of the curve.\n\nFrom trending tools to career tips, we''ve got you covered.\n\nBest regards,\nAI Coach Portal Team', 'Read Latest Blogs', '/ai-blogs', 'blog'),
('AI Game Invitation', 'Challenge Your AI Knowledge with Daily Zip!', E'Hello {Name},\n\nTest your AI knowledge with our daily puzzle game - Daily Zip!\n\nCompete with other learners and climb the leaderboard.\n\nBest regards,\nAI Coach Portal Team', 'Play Daily Zip', '/daily-zip', 'game'),
('Newsletter', 'AI Coach Portal Weekly Update', E'Hello {Name},\n\nHere''s your weekly roundup from AI Coach Portal:\n\n• New courses added\n• Upcoming webinars\n• Latest AI trends\n• Top performer highlights\n\nStay connected with the AI community!\n\nBest regards,\nAI Coach Portal Team', 'Visit AI Coach Portal', '/', 'newsletter');
