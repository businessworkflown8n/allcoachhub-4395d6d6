
-- Fix 1: Restrict user_roles INSERT to only allow 'learner' role self-assignment
-- (coach/admin roles must be assigned by admins or triggers)
DROP POLICY IF EXISTS "Users can insert their own role" ON user_roles;

CREATE POLICY "Users can only self-assign learner role"
ON user_roles FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'learner'
);

-- Fix 2: Tighten coach enrollment SELECT policy to verify course ownership
DROP POLICY IF EXISTS "Coaches can view enrollments for their courses" ON enrollments;

CREATE POLICY "Coaches can view enrollments for their courses"
ON enrollments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = enrollments.course_id 
    AND courses.coach_id = auth.uid()
  )
);

-- Fix 3: Tighten coach enrollment UPDATE policy similarly
DROP POLICY IF EXISTS "Coaches can update enrollments for their courses" ON enrollments;

CREATE POLICY "Coaches can update enrollments for their courses"
ON enrollments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = enrollments.course_id 
    AND courses.coach_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = enrollments.course_id 
    AND courses.coach_id = auth.uid()
  )
);
