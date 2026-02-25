-- Add approval_status to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add is_suspended to profiles table for activate/deactivate
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;

-- Update existing published courses to approved
UPDATE public.courses SET approval_status = 'approved' WHERE is_published = true;

-- Create admin policy for managing profiles suspension
CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create admin policy for deleting user_roles
CREATE POLICY "Admins can delete user roles" ON public.user_roles
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create admin policy for deleting profiles  
CREATE POLICY "Admins can delete profiles" ON public.profiles
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);