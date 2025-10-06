-- COMPLETE RLS DISABLE - Run this immediately in Supabase SQL Editor
-- This will completely disable RLS and remove all policies

-- Step 1: Disable RLS on ALL tables
ALTER TABLE student_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE interviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE skills_master DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (comprehensive cleanup)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on all tables
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Step 3: Force disable RLS on all tables (double check)
ALTER TABLE student_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE interviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE skills_master DISABLE ROW LEVEL SECURITY;

-- Step 4: Verify RLS is completely disabled
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = false THEN '✅ RLS DISABLED'
        ELSE '❌ RLS STILL ENABLED'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'student_achievements', 'students', 'users', 'applications',
    'opportunities', 'companies', 'notifications', 'interviews',
    'analytics_events', 'skills_master'
)
ORDER BY tablename;

-- Step 5: Test message
SELECT '🎉 RLS COMPLETELY DISABLED - Your app should work now!' as result;



