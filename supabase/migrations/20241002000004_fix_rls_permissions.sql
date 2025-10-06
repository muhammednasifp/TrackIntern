-- Fix RLS permissions for student_achievements
-- This migration makes the policies more permissive for authenticated users

-- Drop all existing policies on student_achievements
DROP POLICY IF EXISTS "Students can read own achievements" ON student_achievements;
DROP POLICY IF EXISTS "Students can insert own achievements" ON student_achievements;
DROP POLICY IF EXISTS "Students can update own achievements" ON student_achievements;
DROP POLICY IF EXISTS "Students can delete own achievements" ON student_achievements;
DROP POLICY IF EXISTS "Students can manage own achievements" ON student_achievements;

-- Create a simple policy that allows authenticated users to manage their own achievements
CREATE POLICY "Authenticated users can manage achievements" ON student_achievements FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM students s 
    WHERE s.student_id = student_achievements.student_id 
    AND s.user_id = auth.uid()
  )
);

-- Also ensure the students table has the correct policies
DROP POLICY IF EXISTS "Students can read own profile" ON students;
DROP POLICY IF EXISTS "Students can update own profile" ON students;
DROP POLICY IF EXISTS "Students can insert own profile" ON students;

-- Recreate students policies with simpler logic
CREATE POLICY "Students can read own profile" ON students FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Students can update own profile" ON students FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Students can insert own profile" ON students FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow companies to read student profiles
CREATE POLICY "Companies can read student profiles" ON students FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.user_id = auth.uid() 
    AND u.user_type = 'company'
  )
);

-- Ensure users table policies are correct
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON users FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Add a function to check if a user can manage achievements
CREATE OR REPLACE FUNCTION can_manage_achievements(target_student_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM students s 
    WHERE s.student_id = target_student_id 
    AND s.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION can_manage_achievements(uuid) TO authenticated;



