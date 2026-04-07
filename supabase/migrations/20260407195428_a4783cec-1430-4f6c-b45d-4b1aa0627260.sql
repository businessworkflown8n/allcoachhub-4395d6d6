
CREATE TABLE public.marquee_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment TEXT NOT NULL DEFAULT 'website' CHECK (segment IN ('website', 'learner', 'coach')),
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  text_color TEXT NOT NULL DEFAULT '#ffffff',
  bg_color TEXT NOT NULL DEFAULT '#0B0F1A',
  scroll_speed INTEGER NOT NULL DEFAULT 50,
  sort_order INTEGER NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marquee_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active marquee messages"
  ON public.marquee_messages FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage marquee messages"
  ON public.marquee_messages FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
