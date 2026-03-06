
-- Create chatbot_leads table
CREATE TABLE public.chatbot_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type text NOT NULL,
  name text NOT NULL,
  whatsapp text NOT NULL,
  email text NOT NULL,
  experience text,
  industry text,
  company text,
  country text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_leads ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public chatbot)
CREATE POLICY "Anyone can insert chatbot leads"
ON public.chatbot_leads FOR INSERT
WITH CHECK (true);

-- Only admins can view/manage
CREATE POLICY "Admins can manage chatbot leads"
ON public.chatbot_leads FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create communication_settings table
CREATE TABLE public.communication_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.communication_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read communication settings"
ON public.communication_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage communication settings"
ON public.communication_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Seed default communication settings
INSERT INTO public.communication_settings (key, value) VALUES
  ('chatbot_enabled', 'true'),
  ('whatsapp_enabled', 'true'),
  ('whatsapp_number', '919852411280'),
  ('whatsapp_message', 'Hi, I would like to know more about AI Coach Portal'),
  ('call_enabled', 'true'),
  ('call_number', '+919852411280');
