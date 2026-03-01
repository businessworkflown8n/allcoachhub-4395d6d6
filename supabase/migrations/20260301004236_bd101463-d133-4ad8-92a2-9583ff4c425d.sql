
CREATE TABLE public.coach_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL UNIQUE,
  commission_percent NUMERIC NOT NULL DEFAULT 20,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage coach commissions" ON public.coach_commissions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Coaches can view own commission" ON public.coach_commissions
  FOR SELECT USING (auth.uid() = coach_id);

CREATE OR REPLACE FUNCTION public.validate_coach_commission()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.commission_percent < 0 OR NEW.commission_percent > 100 THEN
    RAISE EXCEPTION 'Commission percent must be between 0 and 100';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER validate_coach_commission_trigger
  BEFORE INSERT OR UPDATE ON public.coach_commissions
  FOR EACH ROW EXECUTE FUNCTION public.validate_coach_commission();
