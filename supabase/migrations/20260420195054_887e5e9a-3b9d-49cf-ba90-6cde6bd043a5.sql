
DROP POLICY IF EXISTS "System inserts audit" ON public.feature_access_audit_log;
CREATE POLICY "Authenticated inserts audit" ON public.feature_access_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Re-declare with explicit search_path to clear linter cache
CREATE OR REPLACE FUNCTION public.get_coach_effective_features(_coach_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bundle_flags JSONB := '{}'::jsonb;
  manual_flags JSONB := '{}'::jsonb;
  result JSONB;
BEGIN
  SELECT fb.feature_flags INTO bundle_flags
  FROM public.coach_subscriptions cs
  JOIN public.feature_bundles fb ON fb.id = cs.bundle_id
  WHERE cs.coach_id = _coach_id AND cs.status IN ('active','trialing')
  LIMIT 1;

  SELECT to_jsonb(cf) - 'id' - 'coach_id' - 'created_at' - 'updated_at' - 'approved_at' - 'approved_by' - 'notes'
  INTO manual_flags
  FROM public.coach_feature_flags cf
  WHERE cf.coach_id = _coach_id;

  result := COALESCE(bundle_flags, '{}'::jsonb) || COALESCE(manual_flags, '{}'::jsonb);
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_feature_flag_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  flag_keys TEXT[] := ARRAY['workshops_access','courses_access','feed_access','messaging_access','paid_content_access','contact_access','profile_picture_access','blueprint_access','materials_access','status'];
  k TEXT;
  old_v JSONB;
  new_v JSONB;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    FOREACH k IN ARRAY flag_keys LOOP
      old_v := to_jsonb(OLD) -> k;
      new_v := to_jsonb(NEW) -> k;
      IF old_v IS DISTINCT FROM new_v THEN
        INSERT INTO public.feature_access_audit_log (coach_id, changed_by, feature_key, old_value, new_value, source)
        VALUES (NEW.coach_id, auth.uid(), k, old_v, new_v, 'manual');
      END IF;
    END LOOP;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.feature_access_audit_log (coach_id, changed_by, feature_key, old_value, new_value, source)
    VALUES (NEW.coach_id, auth.uid(), '__created__', NULL, to_jsonb(NEW), 'system');
  END IF;
  RETURN NEW;
END;
$$;
