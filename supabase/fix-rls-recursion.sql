-- Fix infinite recursion in profiles RLS policies
-- The problem: policies on `profiles` that SELECT from `profiles` cause infinite recursion

-- Step 1: Drop the broken policies
DROP POLICY IF EXISTS "Students can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can read profiles in their department" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

-- Step 2: Create simple, non-recursive policies
-- Every authenticated user can read their own profile
CREATE POLICY "Users can read their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Authenticated users can read any profile (needed for complaint name lookups)
CREATE POLICY "Authenticated users can read all profiles" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Fix complaint_logs and complaints policies that also reference profiles
DROP POLICY IF EXISTS "Admins can read all complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins can update all complaints" ON public.complaints;
DROP POLICY IF EXISTS "Users can read logs for complaints they have access to" ON public.complaint_logs;
DROP POLICY IF EXISTS "Users can insert logs for complaints they are involved in" ON public.complaint_logs;

-- Recreate complaints admin policies using auth.jwt() instead of profiles subquery
CREATE POLICY "Admins can read all complaints" ON public.complaints
  FOR SELECT USING (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all complaints" ON public.complaints
  FOR UPDATE USING (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Recreate complaint_logs policies without nested profiles queries
CREATE POLICY "Users can read logs for accessible complaints" ON public.complaint_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = complaint_id AND (
        c.student_id = auth.uid()
        OR c.assigned_staff_id = auth.uid()
        OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
      )
    )
  );

CREATE POLICY "Users can insert logs for accessible complaints" ON public.complaint_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = complaint_id AND (
        c.student_id = auth.uid()
        OR c.assigned_staff_id = auth.uid()
        OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
      )
    )
  );
