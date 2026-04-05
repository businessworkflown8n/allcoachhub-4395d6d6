
-- WhatsApp access control table
CREATE TABLE public.whatsapp_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  daily_message_limit INTEGER DEFAULT 1000,
  monthly_campaign_credits INTEGER DEFAULT 10,
  granted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(coach_id)
);

ALTER TABLE public.whatsapp_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage whatsapp access" ON public.whatsapp_access
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches can view own whatsapp access" ON public.whatsapp_access
  FOR SELECT TO authenticated
  USING (coach_id = auth.uid());

-- WhatsApp campaign templates
CREATE TABLE public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'promotion',
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'approved',
  is_global BOOLEAN NOT NULL DEFAULT true,
  coach_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read global templates" ON public.whatsapp_templates
  FOR SELECT TO authenticated
  USING (is_global = true OR coach_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage templates" ON public.whatsapp_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- WhatsApp contacts
CREATE TABLE public.whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  phone TEXT NOT NULL,
  name TEXT,
  email TEXT,
  tags TEXT[] DEFAULT '{}',
  is_opted_in BOOLEAN NOT NULL DEFAULT true,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own contacts" ON public.whatsapp_contacts
  FOR ALL TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "Admins can view all contacts" ON public.whatsapp_contacts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- WhatsApp campaigns
CREATE TABLE public.whatsapp_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  name TEXT NOT NULL,
  template_id UUID REFERENCES public.whatsapp_templates(id),
  status TEXT NOT NULL DEFAULT 'draft',
  audience_type TEXT NOT NULL DEFAULT 'all',
  audience_tags TEXT[] DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_read INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_replied INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own campaigns" ON public.whatsapp_campaigns
  FOR ALL TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "Admins can view all campaigns" ON public.whatsapp_campaigns
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default templates
INSERT INTO public.whatsapp_templates (name, category, content, variables, status, is_global) VALUES
('Course Promotion', 'promotion', 'Hi {{name}}, check out our new course "{{course_name}}" — limited seats available! Enroll now: {{link}}', ARRAY['name','course_name','link'], 'approved', true),
('Webinar Invite', 'event', 'Hi {{name}}, you''re invited to our live webinar "{{webinar_title}}" on {{date}}. Register: {{link}}', ARRAY['name','webinar_title','date','link'], 'approved', true),
('Session Reminder', 'reminder', 'Hi {{name}}, your session is scheduled for {{date}} at {{time}}. See you there!', ARRAY['name','date','time'], 'approved', true),
('Follow-up', 'followup', 'Hi {{name}}, we noticed you showed interest in {{topic}}. Would you like to learn more? Reply YES to connect.', ARRAY['name','topic'], 'approved', true),
('Welcome Message', 'onboarding', 'Welcome {{name}}! 🎉 Thank you for joining. Explore courses and start your learning journey: {{link}}', ARRAY['name','link'], 'approved', true);
