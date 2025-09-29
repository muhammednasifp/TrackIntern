/*
  # TrackIntern Core Database Schema

  ## Overview
  Complete database schema for the TrackIntern platform including user management,
  student profiles, company accounts, opportunities, applications, and analytics.

  ## Tables Created
  1. New Tables
    - `users` - Master authentication table with multi-role support
    - `students` - Detailed student profiles with skills and achievements
    - `companies` - Verified company accounts with branding
    - `opportunities` - Internships and placements with AI matching
    - `applications` - Application tracking with status pipeline
    - `notifications` - Real-time notification system
    - `skills_master` - Standardized skills database
    - `student_achievements` - Portfolio and certification tracking
    - `interviews` - Interview management and scheduling
    - `analytics_events` - User behavior tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
    - User type-specific data access
    - Secure document storage references

  3. Features
    - UUID primary keys for security
    - JSON columns for flexible data storage
    - Comprehensive indexing for performance
    - Audit trails with timestamps
    - Multi-role authentication support
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

-- 1. USERS - Master Authentication Table
CREATE TABLE IF NOT EXISTS users (
  user_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  password_hash text,
  user_type user_type_enum NOT NULL DEFAULT 'student',
  verification_status verification_status_enum DEFAULT 'pending',
  two_factor_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz,
  ip_address text,
  login_attempts integer DEFAULT 0,
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
  brand_logo_url text,
  industry_type text,
  company_size company_size_enum DEFAULT 'startup',
  headquarters_location text,
  other_locations jsonb DEFAULT '[]'::jsonb,
  website text,
  company_email_domain text,
  verification_documents jsonb DEFAULT '{}'::jsonb,
  description text,
  founded_year integer,
  employee_count integer,
  tech_stack jsonb DEFAULT '[]'::jsonb,
  company_culture jsonb DEFAULT '{}'::jsonb,
  benefits jsonb DEFAULT '[]'::jsonb,
  glassdoor_rating decimal(2,1) CHECK (glassdoor_rating >= 0 AND glassdoor_rating <= 5),
  is_featured boolean DEFAULT false,
  subscription_tier subscription_tier_enum DEFAULT 'free',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. OPPORTUNITIES - Internships & Placements
CREATE TABLE IF NOT EXISTS opportunities (
  opportunity_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(company_id) ON DELETE CASCADE,
  type opportunity_type_enum NOT NULL DEFAULT 'internship',
  title text NOT NULL,
  slug text UNIQUE,
  description text,
  requirements jsonb DEFAULT '{}'::jsonb,
  preferred_skills jsonb DEFAULT '[]'::jsonb,
  stipend_min integer,
  stipend_max integer,
  currency text DEFAULT 'INR',
  duration_months integer,
  start_date date,
  location jsonb DEFAULT '[]'::jsonb,
  work_mode work_mode_enum DEFAULT 'hybrid',
  application_deadline date,
  max_applications integer,
  current_applications integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'closed', 'filled')),
  selection_process jsonb DEFAULT '[]'::jsonb,
  perks jsonb DEFAULT '[]'::jsonb,
  is_ppo_offered boolean DEFAULT false,
  conversion_probability integer CHECK (conversion_probability >= 0 AND conversion_probability <= 100),
  view_count integer DEFAULT 0,
  ai_match_keywords text,
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
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);

-- Create GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_students_skills ON students USING gin(skills);
CREATE INDEX IF NOT EXISTS idx_opportunities_requirements ON opportunities USING gin(requirements);
CREATE INDEX IF NOT EXISTS idx_opportunities_preferred_skills ON opportunities USING gin(preferred_skills);

-- Create text search indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_search ON opportunities USING gin(to_tsvector('english', title || ' ' || description));
CREATE INDEX IF NOT EXISTS idx_companies_search ON companies USING gin(to_tsvector('english', company_name || ' ' || description));

-- Enable Row Level Security
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

-- RLS Policies for users table
CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for students table
CREATE POLICY "Students can read own profile" ON students FOR SELECT TO authenticated USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM users WHERE users.user_id = auth.uid() AND users.user_type IN ('company', 'admin'))
);
CREATE POLICY "Students can update own profile" ON students FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Students can insert own profile" ON students FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS Policies for companies table
CREATE POLICY "Companies can read own profile" ON companies FOR SELECT TO authenticated USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM users WHERE users.user_id = auth.uid() AND users.user_type IN ('student', 'admin'))
);
CREATE POLICY "Companies can update own profile" ON companies FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Companies can insert own profile" ON companies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS Policies for opportunities table
CREATE POLICY "Anyone can read active opportunities" ON opportunities FOR SELECT TO authenticated USING (status = 'active');
CREATE POLICY "Companies can manage own opportunities" ON opportunities FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM companies WHERE companies.company_id = opportunities.company_id AND companies.user_id = auth.uid())
);
CREATE POLICY "Companies can insert opportunities" ON opportunities FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM companies WHERE companies.company_id = opportunities.company_id AND companies.user_id = auth.uid())
);

-- RLS Policies for applications table
CREATE POLICY "Students can read own applications" ON applications FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM students WHERE students.student_id = applications.student_id AND students.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM opportunities o JOIN companies c ON o.company_id = c.company_id 
          WHERE o.opportunity_id = applications.opportunity_id AND c.user_id = auth.uid())
);
CREATE POLICY "Students can manage own applications" ON applications FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM students WHERE students.student_id = applications.student_id AND students.user_id = auth.uid())
);
CREATE POLICY "Students can insert applications" ON applications FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM students WHERE students.student_id = applications.student_id AND students.user_id = auth.uid())
);

-- RLS Policies for notifications table
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for skills_master table (public read)
CREATE POLICY "Anyone can read skills" ON skills_master FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage skills" ON skills_master FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE users.user_id = auth.uid() AND users.user_type = 'admin')
);

-- RLS Policies for student_achievements table
CREATE POLICY "Students can read own achievements" ON student_achievements FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM students WHERE students.student_id = student_achievements.student_id AND students.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM users WHERE users.user_id = auth.uid() AND users.user_type IN ('company', 'admin'))
);
CREATE POLICY "Students can manage own achievements" ON student_achievements FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM students WHERE students.student_id = student_achievements.student_id AND students.user_id = auth.uid())
);
CREATE POLICY "Students can insert achievements" ON student_achievements FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM students WHERE students.student_id = student_achievements.student_id AND students.user_id = auth.uid())
);

-- RLS Policies for interviews table
CREATE POLICY "Students and companies can read related interviews" ON interviews FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM applications a 
    JOIN students s ON a.student_id = s.student_id 
    WHERE a.application_id = interviews.application_id AND s.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM applications a 
    JOIN opportunities o ON a.opportunity_id = o.opportunity_id 
    JOIN companies c ON o.company_id = c.company_id 
    WHERE a.application_id = interviews.application_id AND c.user_id = auth.uid()
  )
);

-- RLS Policies for analytics_events table
CREATE POLICY "Users can insert own events" ON analytics_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read analytics" ON analytics_events FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE users.user_id = auth.uid() AND users.user_type = 'admin')
);

-- Insert some default skills
INSERT INTO skills_master (skill_name, category, is_trending, demand_index) VALUES
('JavaScript', 'technical', true, 95),
('Python', 'technical', true, 90),
('React', 'framework', true, 85),
('Node.js', 'framework', true, 80),
('TypeScript', 'technical', true, 75),
('SQL', 'technical', false, 70),
('Git', 'tool', false, 65),
('AWS', 'tool', true, 88),
('Docker', 'tool', true, 72),
('MongoDB', 'technical', false, 60),
('Communication', 'soft', false, 95),
('Problem Solving', 'soft', false, 90),
('Leadership', 'soft', false, 80),
('Teamwork', 'soft', false, 85),
('Time Management', 'soft', false, 75)
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