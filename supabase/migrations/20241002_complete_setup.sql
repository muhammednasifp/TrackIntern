/*
  # Complete TrackIntern Database Setup
  
  This migration creates the entire database schema with:
  - All tables with proper relationships
  - Auth triggers for automatic user sync
  - Correct RLS policies that work with auth.uid()
  - Sample data for testing
  - No foreign key constraint issues
  - No 406 Not Acceptable errors
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Custom types for better data integrity
CREATE TYPE user_type_enum AS ENUM ('student', 'company', 'admin', 'college_coordinator');
CREATE TYPE verification_status_enum AS ENUM ('pending', 'verified', 'rejected', 'suspended');
CREATE TYPE company_size_enum AS ENUM ('startup', 'mid-size', 'enterprise', 'mnc');
CREATE TYPE opportunity_type_enum AS ENUM ('internship', 'placement', 'apprenticeship');
CREATE TYPE work_mode_enum AS ENUM ('remote', 'hybrid', 'onsite');
CREATE TYPE application_status_enum AS ENUM (
  'draft', 'submitted', 'under_review', 'shortlisted', 
  'interview_scheduled', 'interviewed', 'selected', 'rejected', 'withdrawn'
);
CREATE TYPE notification_type_enum AS ENUM (
  'application_update', 'new_opportunity', 'deadline_reminder', 
  'profile_view', 'message', 'system'
);
CREATE TYPE priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE skill_category_enum AS ENUM ('technical', 'soft', 'tool', 'language', 'framework');
CREATE TYPE achievement_type_enum AS ENUM ('certification', 'project', 'hackathon', 'publication', 'award');
CREATE TYPE interview_type_enum AS ENUM ('technical', 'hr', 'managerial', 'group');
CREATE TYPE interview_status_enum AS ENUM ('scheduled', 'completed', 'cancelled', 'rescheduled');
CREATE TYPE subscription_tier_enum AS ENUM ('free', 'pro', 'enterprise');

-- 1. USERS - Master Authentication Table (synced with auth.users)
CREATE TABLE IF NOT EXISTS users (
  user_id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  user_type user_type_enum NOT NULL DEFAULT 'student',
  verification_status verification_status_enum DEFAULT 'pending',
  two_factor_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz,
  is_active boolean DEFAULT true,
  email_verified boolean DEFAULT false,
  phone text,
  phone_verified boolean DEFAULT false
);

-- 2. STUDENTS - Detailed Student Profiles
CREATE TABLE IF NOT EXISTS students (
  student_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(user_id) ON DELETE CASCADE,
  full_name text NOT NULL,
  college_name text,
  university_email text,
  course text,
  specialization text,
  year_of_study integer CHECK (year_of_study >= 1 AND year_of_study <= 4),
  expected_graduation date,
  cgpa decimal(3,2) CHECK (cgpa >= 0 AND cgpa <= 10),
  skills jsonb DEFAULT '[]'::jsonb,
  resume_url text,
  college_id_proof_url text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  leetcode_profile text,
  achievements_count integer DEFAULT 0,
  profile_views integer DEFAULT 0,
  profile_strength integer DEFAULT 0 CHECK (profile_strength >= 0 AND profile_strength <= 100),
  preferred_locations jsonb DEFAULT '[]'::jsonb,
  expected_salary_min integer,
  expected_salary_max integer,
  available_from date DEFAULT CURRENT_DATE,
  bio text,
  profile_image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. COMPANIES - Verified Company Accounts
CREATE TABLE IF NOT EXISTS companies (
  company_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(user_id) ON DELETE CASCADE,
  company_name text NOT NULL,
  company_description text,
  industry text,
  company_size company_size_enum,
  headquarters_location text,
  website_url text,
  linkedin_url text,
  logo_url text,
  founded_year integer,
  employee_count_range text,
  company_culture jsonb DEFAULT '{}'::jsonb,
  benefits_offered jsonb DEFAULT '[]'::jsonb,
  tech_stack jsonb DEFAULT '[]'::jsonb,
  verification_documents jsonb DEFAULT '[]'::jsonb,
  is_verified boolean DEFAULT false,
  subscription_tier subscription_tier_enum DEFAULT 'free',
  credits_remaining integer DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. OPPORTUNITIES - Internships and Placements
CREATE TABLE IF NOT EXISTS opportunities (
  opportunity_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(company_id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type opportunity_type_enum NOT NULL,
  work_mode work_mode_enum DEFAULT 'hybrid',
  location text,
  duration_months integer,
  stipend_min integer,
  stipend_max integer,
  currency text DEFAULT 'INR',
  required_skills jsonb DEFAULT '[]'::jsonb,
  preferred_skills jsonb DEFAULT '[]'::jsonb,
  eligibility_criteria jsonb DEFAULT '{}'::jsonb,
  application_deadline date,
  start_date date,
  positions_available integer DEFAULT 1,
  positions_filled integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'closed', 'expired')),
  application_process jsonb DEFAULT '{}'::jsonb,
  additional_questions jsonb DEFAULT '[]'::jsonb,
  perks_benefits jsonb DEFAULT '[]'::jsonb,
  is_featured boolean DEFAULT false,
  views_count integer DEFAULT 0,
  applications_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. APPLICATIONS - Application Tracking
CREATE TABLE IF NOT EXISTS applications (
  application_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid REFERENCES students(student_id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES opportunities(opportunity_id) ON DELETE CASCADE,
  status application_status_enum DEFAULT 'draft',
  applied_date timestamptz,
  status_updated_at timestamptz DEFAULT now(),
  cover_letter text,
  additional_documents jsonb DEFAULT '[]'::jsonb,
  answers_to_questions jsonb DEFAULT '{}'::jsonb,
  rating_by_company integer CHECK (rating_by_company >= 1 AND rating_by_company <= 5),
  feedback_by_company text,
  interview_dates jsonb DEFAULT '[]'::jsonb,
  offer_letter_url text,
  is_accepted boolean,
  rejection_reason text,
  application_score integer CHECK (application_score >= 0 AND application_score <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, opportunity_id)
);

-- 6. NOTIFICATIONS - Real-time Notification System
CREATE TABLE IF NOT EXISTS notifications (
  notification_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(user_id) ON DELETE CASCADE,
  type notification_type_enum NOT NULL,
  title text NOT NULL,
  message text,
  action_url text,
  is_read boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  priority priority_enum DEFAULT 'medium',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- 7. SKILLS_MASTER - Standardized Skills Database
CREATE TABLE IF NOT EXISTS skills_master (
  skill_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_name text UNIQUE NOT NULL,
  category skill_category_enum NOT NULL,
  is_trending boolean DEFAULT false,
  demand_index integer DEFAULT 0,
  related_skills jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 8. STUDENT_ACHIEVEMENTS - Portfolio Building
CREATE TABLE IF NOT EXISTS student_achievements (
  achievement_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid REFERENCES students(student_id) ON DELETE CASCADE,
  type achievement_type_enum NOT NULL,
  title text NOT NULL,
  issuing_organization text,
  description text,
  date_achieved date,
  certificate_url text,
  verification_url text,
  skills_demonstrated jsonb DEFAULT '[]'::jsonb,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 9. INTERVIEWS - Interview Management
CREATE TABLE IF NOT EXISTS interviews (
  interview_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id uuid REFERENCES applications(application_id) ON DELETE CASCADE,
  round_number integer DEFAULT 1,
  interview_type interview_type_enum NOT NULL,
  scheduled_at timestamptz,
  duration_minutes integer DEFAULT 60,
  meeting_link text,
  interviewer_names jsonb DEFAULT '[]'::jsonb,
  status interview_status_enum DEFAULT 'scheduled',
  feedback text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 10. ANALYTICS_EVENTS - User Behavior Tracking
CREATE TABLE IF NOT EXISTS analytics_events (
  event_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(user_id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz DEFAULT now(),
  session_id text,
  ip_address text,
  user_agent text
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_college ON students(college_name);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_company_id ON opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills_master(category);
CREATE INDEX IF NOT EXISTS idx_achievements_student_id ON student_achievements(student_id);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- AUTH TRIGGERS - Automatic user sync between auth.users and custom users table
-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into custom users table when a new auth user is created
  INSERT INTO public.users (
    user_id,
    email,
    user_type,
    verification_status,
    email_verified,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'student')::user_type_enum,
    CASE 
      WHEN NEW.email_confirmed_at IS NOT NULL THEN 'verified'::verification_status_enum
      ELSE 'pending'::verification_status_enum
    END,
    NEW.email_confirmed_at IS NOT NULL,
    NEW.created_at,
    NEW.updated_at
  );
  
  -- If the user is a student, also create a basic student profile
  IF COALESCE(NEW.raw_user_meta_data->>'user_type', 'student') = 'student' THEN
    INSERT INTO public.students (
      user_id,
      full_name,
      profile_strength
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
      10
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users SET
    email = NEW.email,
    email_verified = NEW.email_confirmed_at IS NOT NULL,
    verification_status = CASE 
      WHEN NEW.email_confirmed_at IS NOT NULL THEN 'verified'::verification_status_enum
      ELSE verification_status
    END,
    updated_at = NEW.updated_at
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user deletion
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.users WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

-- RLS POLICIES - Working with auth.uid() directly (no foreign key issues)

-- Users table policies
CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON users FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

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

-- Companies table policies
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

-- Opportunities policies
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

-- Applications policies
CREATE POLICY "Students can manage own applications" ON applications FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM students s 
    WHERE s.student_id = applications.student_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Companies can read applications to their opportunities" ON applications FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM opportunities o
    JOIN companies c ON c.company_id = o.company_id
    WHERE o.opportunity_id = applications.opportunity_id 
    AND c.user_id = auth.uid()
  )
);

-- Student achievements policies
CREATE POLICY "Students can manage own achievements" ON student_achievements FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM students s 
    WHERE s.student_id = student_achievements.student_id 
    AND s.user_id = auth.uid()
  )
);

-- Skills master - allow all authenticated users to read
CREATE POLICY "All users can read skills" ON skills_master FOR SELECT TO authenticated 
USING (true);

-- Notifications policies
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL TO authenticated 
USING (auth.uid() = user_id);

-- Interviews policies
CREATE POLICY "Students can read own interviews" ON interviews FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM applications a
    JOIN students s ON s.student_id = a.student_id
    WHERE a.application_id = interviews.application_id 
    AND s.user_id = auth.uid()
  )
);

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
CREATE POLICY "Users can insert own analytics" ON analytics_events FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own analytics" ON analytics_events FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- SAMPLE DATA - Essential skills for testing
INSERT INTO skills_master (skill_name, category, is_trending, demand_index) VALUES
-- Technical Skills
('JavaScript', 'technical', true, 95),
('Python', 'technical', true, 90),
('React', 'framework', true, 88),
('Node.js', 'framework', true, 85),
('TypeScript', 'technical', true, 82),
('Java', 'technical', false, 80),
('HTML/CSS', 'technical', false, 75),
('SQL', 'technical', false, 78),
('MongoDB', 'technical', true, 70),
('PostgreSQL', 'technical', false, 72),
('Express.js', 'framework', true, 68),
('Next.js', 'framework', true, 75),
('Vue.js', 'framework', false, 65),
('Angular', 'framework', false, 70),
('Flutter', 'framework', true, 73),
('React Native', 'framework', true, 71),
('Docker', 'tool', true, 77),
('Git', 'tool', false, 85),
('AWS', 'tool', true, 80),
('Firebase', 'tool', true, 68),

-- Soft Skills
('Communication', 'soft', false, 95),
('Problem Solving', 'soft', false, 90),
('Leadership', 'soft', false, 80),
('Teamwork', 'soft', false, 85),
('Time Management', 'soft', false, 75),
('Critical Thinking', 'soft', false, 82),
('Adaptability', 'soft', false, 78),
('Creativity', 'soft', false, 70)

ON CONFLICT (skill_name) DO NOTHING;

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
('resumes', 'resumes', true),
('profile-images', 'profile-images', true),
('company-logos', 'company-logos', true),
('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload own files" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id IN ('resumes', 'profile-images', 'certificates') AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files" ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id IN ('resumes', 'profile-images', 'certificates') AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own files" ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id IN ('resumes', 'profile-images', 'certificates') AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id IN ('resumes', 'profile-images', 'certificates') AND auth.uid()::text = (storage.foldername(name))[1]);

-- Company logos - allow companies to manage their logos
CREATE POLICY "Companies can manage logos" ON storage.objects FOR ALL TO authenticated 
USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to company logos and profile images
CREATE POLICY "Public can view company logos" ON storage.objects FOR SELECT TO public 
USING (bucket_id = 'company-logos');

CREATE POLICY "Public can view profile images" ON storage.objects FOR SELECT TO public 
USING (bucket_id = 'profile-images');
