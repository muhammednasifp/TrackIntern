-- Comprehensive RLS policy fixes for TrackIntern
-- This migration fixes all RLS policy issues

-- First, let's check if we have the correct user_id in the students table
-- and ensure the RLS policies work correctly

-- Fix student_achievements policies
DROP POLICY IF EXISTS "Students can read own achievements" ON student_achievements;
DROP POLICY IF EXISTS "Students can insert own achievements" ON student_achievements;
DROP POLICY IF EXISTS "Students can update own achievements" ON student_achievements;
DROP POLICY IF EXISTS "Students can delete own achievements" ON student_achievements;
DROP POLICY IF EXISTS "Students can manage own achievements" ON student_achievements;

-- Create a comprehensive policy for student_achievements
CREATE POLICY "Students can manage own achievements" ON student_achievements FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM students s 
    WHERE s.student_id = student_achievements.student_id 
    AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM students s 
    WHERE s.student_id = student_achievements.student_id 
    AND s.user_id = auth.uid()
  )
);

-- Also fix the students table policies to ensure they work correctly
DROP POLICY IF EXISTS "Students can read own profile" ON students;
DROP POLICY IF EXISTS "Students can update own profile" ON students;
DROP POLICY IF EXISTS "Students can insert own profile" ON students;

-- Recreate students policies
CREATE POLICY "Students can read own profile" ON students FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Students can update own profile" ON students FOR UPDATE TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can insert own profile" ON students FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow companies to read student profiles (for recruitment)
CREATE POLICY "Companies can read student profiles" ON students FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.user_id = auth.uid() 
    AND u.user_type = 'company'
  )
);

-- Ensure the users table policies are correct
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON users FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Add a function to help with RLS debugging
CREATE OR REPLACE FUNCTION debug_user_context()
RETURNS TABLE (
  current_user_id uuid,
  current_user_type text,
  student_id uuid,
  student_user_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as current_user_id,
    COALESCE(u.user_type::text, 'unknown') as current_user_type,
    s.student_id,
    s.user_id as student_user_id
  FROM users u
  LEFT JOIN students s ON s.user_id = u.user_id
  WHERE u.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION debug_user_context() TO authenticated;


