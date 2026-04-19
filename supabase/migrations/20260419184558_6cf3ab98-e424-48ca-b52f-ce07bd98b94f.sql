ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS coach_id uuid,
  ADD COLUMN IF NOT EXISTS audience_scope text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS audience_course_id uuid,
  ADD COLUMN IF NOT EXISTS tags text[];

ALTER TABLE public.materials DROP CONSTRAINT IF EXISTS materials_audience_scope_check;
ALTER TABLE public.materials
  ADD CONSTRAINT materials_audience_scope_check
  CHECK (audience_scope IN ('public','coach_all_learners','coach_course_learners'));

CREATE INDEX IF NOT EXISTS idx_materials_coach_id ON public.materials(coach_id);
CREATE INDEX IF NOT EXISTS idx_materials_audience_course ON public.materials(audience_course_id);

ALTER TABLE public.coach_feature_flags
  ADD COLUMN IF NOT EXISTS materials_access boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.learner_enrolled_with_coach(_learner uuid, _coach uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE learner_id = _learner AND coach_id = _coach
  );
$$;

CREATE OR REPLACE FUNCTION public.learner_enrolled_in_course(_learner uuid, _course uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE learner_id = _learner AND course_id = _course
  );
$$;

DROP POLICY IF EXISTS "Authenticated users can view published materials" ON public.materials;
DROP POLICY IF EXISTS "Coaches can manage own materials" ON public.materials;
DROP POLICY IF EXISTS "Users can view targeted materials" ON public.materials;

CREATE POLICY "Coaches can manage own materials"
ON public.materials
FOR ALL
TO authenticated
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid() AND audience_scope IN ('coach_all_learners','coach_course_learners'));

CREATE POLICY "Users can view targeted materials"
ON public.materials
FOR SELECT
TO authenticated
USING (
  is_published = true AND (
    audience_scope = 'public'
    OR (audience_scope = 'coach_all_learners' AND public.learner_enrolled_with_coach(auth.uid(), coach_id))
    OR (audience_scope = 'coach_course_learners' AND audience_course_id IS NOT NULL AND public.learner_enrolled_in_course(auth.uid(), audience_course_id))
    OR coach_id = auth.uid()
  )
);