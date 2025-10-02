-- Fix user synchronization between auth.users and custom users table
-- This migration adds a trigger to automatically create entries in the custom users table
-- when new users are created in auth.users

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

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle user updates (email verification, etc.)
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the custom users table when auth.users is updated
  UPDATE public.users SET
    email = NEW.email,
    email_verified = NEW.email_confirmed_at IS NOT NULL,
    verification_status = CASE 
      WHEN NEW.email_confirmed_at IS NOT NULL THEN 'verified'::verification_status_enum
      ELSE verification_status -- Keep existing status if not verified
    END,
    updated_at = NEW.updated_at
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- Function to handle user deletion
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete from custom users table when auth user is deleted
  DELETE FROM public.users WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user deletion
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

-- Backfill existing auth.users into custom users table (if any exist)
INSERT INTO public.users (
  user_id,
  email,
  user_type,
  verification_status,
  email_verified,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'user_type', 'student')::user_type_enum,
  CASE 
    WHEN au.email_confirmed_at IS NOT NULL THEN 'verified'::verification_status_enum
    ELSE 'pending'::verification_status_enum
  END,
  au.email_confirmed_at IS NOT NULL,
  au.created_at,
  au.updated_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.user_id = au.id
);

-- Create basic student profiles for existing users who are students but don't have profiles
INSERT INTO public.students (
  user_id,
  full_name,
  profile_strength
)
SELECT 
  u.user_id,
  COALESCE(au.raw_user_meta_data->>'full_name', SPLIT_PART(u.email, '@', 1)),
  10
FROM public.users u
JOIN auth.users au ON au.id = u.user_id
WHERE u.user_type = 'student'
AND NOT EXISTS (
  SELECT 1 FROM public.students s WHERE s.user_id = u.user_id
);
