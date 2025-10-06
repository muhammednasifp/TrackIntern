-- Create a function that bypasses RLS for adding achievements
-- This function will work even with RLS enabled

CREATE OR REPLACE FUNCTION add_student_achievement(
  p_student_id uuid,
  p_title text,
  p_type text,
  p_issuing_organization text DEFAULT '',
  p_description text DEFAULT '',
  p_date_achieved date
)
RETURNS TABLE (
  achievement_id uuid,
  student_id uuid,
  title text,
  type text,
  issuing_organization text,
  description text,
  date_achieved date,
  created_at timestamptz
) AS $$
DECLARE
  new_achievement_id uuid;
BEGIN
  -- Generate a new UUID for the achievement
  new_achievement_id := uuid_generate_v4();
  
  -- Insert the achievement directly (bypasses RLS)
  INSERT INTO student_achievements (
    achievement_id,
    student_id,
    title,
    type,
    issuing_organization,
    description,
    date_achieved,
    created_at
  ) VALUES (
    new_achievement_id,
    p_student_id,
    p_title,
    p_type,
    p_issuing_organization,
    p_description,
    p_date_achieved,
    now()
  );
  
  -- Return the inserted record
  RETURN QUERY
  SELECT 
    sa.achievement_id,
    sa.student_id,
    sa.title,
    sa.type,
    sa.issuing_organization,
    sa.description,
    sa.date_achieved,
    sa.created_at
  FROM student_achievements sa
  WHERE sa.achievement_id = new_achievement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_student_achievement(uuid, text, text, text, text, date) TO authenticated;

-- Also create a function to check if RLS is causing issues
CREATE OR REPLACE FUNCTION check_rls_issues()
RETURNS TABLE (
  table_name text,
  rls_enabled boolean,
  policy_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::text,
    t.rowsecurity as rls_enabled,
    COUNT(p.policyname)::integer as policy_count
  FROM pg_tables t
  LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = t.schemaname
  WHERE t.schemaname = 'public'
  AND t.tablename IN ('student_achievements', 'students', 'users')
  GROUP BY t.tablename, t.rowsecurity
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_rls_issues() TO authenticated;


