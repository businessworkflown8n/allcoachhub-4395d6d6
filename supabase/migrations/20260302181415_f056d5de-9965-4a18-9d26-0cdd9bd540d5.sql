
-- Webinars table
CREATE TABLE public.webinars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  webinar_date DATE NOT NULL,
  webinar_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  webinar_link TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Webinar registrations table
CREATE TABLE public.webinar_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webinar_id UUID NOT NULL REFERENCES public.webinars(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email_sent BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(webinar_id, learner_id)
);

-- Enable RLS
ALTER TABLE public.webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinar_registrations ENABLE ROW LEVEL SECURITY;

-- Webinars RLS
CREATE POLICY "Anyone can view published webinars" ON public.webinars FOR SELECT USING (is_published = true);
CREATE POLICY "Coaches can view own webinars" ON public.webinars FOR SELECT USING (auth.uid() = coach_id);
CREATE POLICY "Coaches can insert own webinars" ON public.webinars FOR INSERT WITH CHECK (auth.uid() = coach_id AND has_role(auth.uid(), 'coach'::app_role));
CREATE POLICY "Coaches can update own webinars" ON public.webinars FOR UPDATE USING (auth.uid() = coach_id AND has_role(auth.uid(), 'coach'::app_role));
CREATE POLICY "Coaches can delete own webinars" ON public.webinars FOR DELETE USING (auth.uid() = coach_id AND has_role(auth.uid(), 'coach'::app_role));
CREATE POLICY "Admins can manage all webinars" ON public.webinars FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Registrations RLS
CREATE POLICY "Learners can view own registrations" ON public.webinar_registrations FOR SELECT USING (auth.uid() = learner_id);
CREATE POLICY "Learners can register for webinars" ON public.webinar_registrations FOR INSERT WITH CHECK (auth.uid() = learner_id);
CREATE POLICY "Coaches can view registrations for own webinars" ON public.webinar_registrations FOR SELECT USING (EXISTS (SELECT 1 FROM public.webinars WHERE webinars.id = webinar_registrations.webinar_id AND webinars.coach_id = auth.uid()));
CREATE POLICY "Admins can manage all registrations" ON public.webinar_registrations FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
