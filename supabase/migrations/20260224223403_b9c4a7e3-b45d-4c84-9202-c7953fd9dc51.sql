
-- Allow coaches to update payment_status on enrollments for their courses
CREATE POLICY "Coaches can update enrollments for their courses"
ON public.enrollments
FOR UPDATE
USING (auth.uid() = coach_id)
WITH CHECK (auth.uid() = coach_id);
