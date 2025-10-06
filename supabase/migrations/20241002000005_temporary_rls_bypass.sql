-- Temporary RLS bypass for testing
-- This migration temporarily disables RLS on student_achievements for testing

-- Temporarily disable RLS on student_achievements
ALTER TABLE student_achievements DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with a very permissive policy
ALTER TABLE student_achievements ENABLE ROW LEVEL SECURITY;

-- Create a very permissive policy for testing
CREATE POLICY "Allow all authenticated users" ON student_achievements FOR ALL TO authenticated 
USING (true)
WITH CHECK (true);

-- Also ensure students table has permissive policies
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for students
CREATE POLICY "Allow authenticated users to manage students" ON students FOR ALL TO authenticated 
USING (true)
WITH CHECK (true);

-- Ensure users table is accessible
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for users
CREATE POLICY "Allow authenticated users to manage users" ON users FOR ALL TO authenticated 
USING (true)
WITH CHECK (true);


