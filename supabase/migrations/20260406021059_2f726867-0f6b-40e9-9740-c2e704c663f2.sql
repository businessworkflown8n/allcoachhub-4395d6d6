
-- Workshop access control table
CREATE TABLE public.workshop_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  meeting_creation BOOLEAN NOT NULL DEFAULT true,
  email_sending BOOLEAN NOT NULL DEFAULT false,
  recording_access BOOLEAN NOT NULL DEFAULT true,
  analytics_access BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(coach_id)
);

ALTER TABLE public.workshop_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage workshop access"
  ON public.workshop_access FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Coaches can read own workshop access"
  ON public.workshop_access FOR SELECT
  TO authenticated
  USING (coach_id = auth.uid());

-- Workshops table
CREATE TABLE public.workshops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  meeting_url TEXT,
  meeting_provider TEXT DEFAULT 'manual',
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_pattern TEXT,
  max_attendees INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled',
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own workshops"
  ON public.workshops FOR ALL
  TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "Admins can manage all workshops"
  ON public.workshops FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Learners can view scheduled workshops"
  ON public.workshops FOR SELECT
  TO authenticated
  USING (status IN ('scheduled', 'live', 'completed'));

-- Workshop registrations table
CREATE TABLE public.workshop_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'registered',
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  watch_duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workshop_id, user_id)
);

ALTER TABLE public.workshop_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own registrations"
  ON public.workshop_registrations FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Coaches can view registrations for own workshops"
  ON public.workshop_registrations FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workshops w WHERE w.id = workshop_id AND w.coach_id = auth.uid()
  ));

CREATE POLICY "Admins can view all registrations"
  ON public.workshop_registrations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
