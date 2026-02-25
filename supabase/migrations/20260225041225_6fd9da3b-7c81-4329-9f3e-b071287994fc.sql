-- Update the course visibility policy to require approval
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
CREATE POLICY "Anyone can view published courses" ON public.courses
FOR SELECT USING (is_published = true AND approval_status = 'approved');

-- Also update coach course creation to default approval_status to pending
-- (already handled by column default)