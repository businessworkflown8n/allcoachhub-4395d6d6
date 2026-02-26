
CREATE TABLE public.payment_status_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL,
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

ALTER TABLE public.payment_status_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage audit logs" ON public.payment_status_audit
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
