-- Fix RLS policies to work with auth.uid() directly
-- This addresses the 406 Not Acceptable errors by updating policies

-- Drop existing policies that depend on the custom users table
DROP POLICY IF EXISTS "Students can read own profile" ON students;
DROP POLICY IF EXISTS "Students can update own profile" ON students;
DROP POLICY IF EXISTS "Students can insert own profile" ON students;
DROP POLICY IF EXISTS "Companies can read own profile" ON companies;
DROP POLICY IF EXISTS "Companies can update own profile" ON companies;
DROP POLICY IF EXISTS "Companies can insert own profile" ON companies;

-- Create new policies that work directly with auth.uid()
-- Students table policies
CREATE POLICY "Students can read own profile" ON students FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Students can update own profile" ON students FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Students can insert own profile" ON students FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow companies to read student profiles (for recruitment)
CREATE POLICY "Companies can read student profiles" ON students FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND au.raw_user_meta_data->>'user_type' = 'company'
  )
);

-- Companies table policies (if needed)
CREATE POLICY "Companies can read own profile" ON companies FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Companies can update own profile" ON companies FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Companies can insert own profile" ON companies FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow students to read company profiles
CREATE POLICY "Students can read company profiles" ON companies FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND COALESCE(au.raw_user_meta_data->>'user_type', 'student') = 'student'
  )
);

-- Update users table policies to work with auth.uid()
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON users FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Student achievements policies
DROP POLICY IF EXISTS "Students can manage own achievements" ON student_achievements;
CREATE POLICY "Students can manage own achievements" ON student_achievements FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM students s 
    WHERE s.student_id = student_achievements.student_id 
    AND s.user_id = auth.uid()
  )
);

-- Skills master - allow all authenticated users to read
DROP POLICY IF EXISTS "All users can read skills" ON skills_master;
CREATE POLICY "All users can read skills" ON skills_master FOR SELECT TO authenticated 
USING (true);

-- Notifications policies
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL TO authenticated 
USING (auth.uid() = user_id);

-- Applications policies
DROP POLICY IF EXISTS "Students can manage own applications" ON applications;
CREATE POLICY "Students can manage own applications" ON applications FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM students s 
    WHERE s.student_id = applications.student_id 
    AND s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Companies can read applications to their opportunities" ON applications;
CREATE POLICY "Companies can read applications to their opportunities" ON applications FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM opportunities o
    JOIN companies c ON c.company_id = o.company_id
    WHERE o.opportunity_id = applications.opportunity_id 
    AND c.user_id = auth.uid()
  )
);

-- Opportunities policies (update existing)
DROP POLICY IF EXISTS "Anyone can read active opportunities" ON opportunities;
DROP POLICY IF EXISTS "Companies can manage own opportunities" ON opportunities;
DROP POLICY IF EXISTS "Companies can insert opportunities" ON opportunities;

CREATE POLICY "Anyone can read active opportunities" ON opportunities FOR SELECT TO authenticated 
USING (status = 'active');

CREATE POLICY "Companies can manage own opportunities" ON opportunities FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM companies c 
    WHERE c.company_id = opportunities.company_id 
    AND c.user_id = auth.uid()
  )
);

-- Interviews policies
DROP POLICY IF EXISTS "Students can read own interviews" ON interviews;
CREATE POLICY "Students can read own interviews" ON interviews FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM applications a
    JOIN students s ON s.student_id = a.student_id
    WHERE a.application_id = interviews.application_id 
    AND s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Companies can manage interviews for their opportunities" ON interviews;
CREATE POLICY "Companies can manage interviews for their opportunities" ON interviews FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM applications a
    JOIN opportunities o ON o.opportunity_id = a.opportunity_id
    JOIN companies c ON c.company_id = o.company_id
    WHERE a.application_id = interviews.application_id 
    AND c.user_id = auth.uid()
  )
);

-- Analytics events policies
DROP POLICY IF EXISTS "Users can insert own analytics" ON analytics_events;
CREATE POLICY "Users can insert own analytics" ON analytics_events FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own analytics" ON analytics_events;
CREATE POLICY "Users can read own analytics" ON analytics_events FOR SELECT TO authenticated 
USING (auth.uid() = user_id);
