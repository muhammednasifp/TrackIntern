import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Company } from '@/types';

interface User {
  id: string;
  email: string;
  user_metadata: {
    user_type?: 'student' | 'company';
    full_name?: string;
  };
}

// Define a simplified profile type for the store
interface StudentProfile {
  student_id: string;
  full_name: string;
  profile_strength: number;
  bio?: string;
  skills?: string[];
  resume_url?: string;
  linkedin_url?: string;
  github_url?: string;
  college_name?: string;
  course?: string;
}

interface AuthState {
  user: User | null;
  profile: StudentProfile | null;
  studentId: string | null;
  loading: boolean;
  userType: 'student' | 'company' | null;
  companyProfile: Company | null;
  companyId: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, userType: 'student' | 'company', fullName: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  studentId: null,
  loading: true,
  userType: null,
  companyProfile: null,
  companyId: null,

  fetchUserProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      // First, ensure we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('No valid session found:', sessionError);
        set({ profile: null, studentId: null, companyProfile: null, companyId: null, userType: null });
        return;
      }

      const userType = (user.user_metadata?.user_type as 'student' | 'company' | undefined) || null;
      set({ userType });

      if (userType === 'student') {
        const { data, error } = await supabase
          .from('students')
          .select('student_id, full_name, profile_strength, bio, skills, resume_url, linkedin_url, github_url, college_name, course')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching student profile:', error);
          throw error;
        }

        if (data) {
          set({ profile: data, studentId: data.student_id, companyProfile: null, companyId: null });
        } else {
          console.log('No student profile found - user may need to complete profile setup');
          set({ profile: null, studentId: null, companyProfile: null, companyId: null });
        }
      } else if (userType === 'company') {
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('company_id, company_name, brand_logo_url, industry_type, company_size, headquarters_location, website, description, glassdoor_rating, tech_stack, benefits')
          .eq('user_id', user.id)
          .single();

        if (companyError && companyError.code !== 'PGRST116') {
          console.error('Error fetching company profile:', companyError);
          throw companyError;
        }

        if (company) {
          set({ companyProfile: company as Company, companyId: company.company_id, profile: null, studentId: null });
        } else {
          console.log('No company profile found - company may need to complete profile setup');
          set({ companyProfile: null, companyId: null, profile: null, studentId: null });
        }
      } else {
        set({ profile: null, studentId: null, companyProfile: null, companyId: null });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      set({ profile: null, studentId: null, companyProfile: null, companyId: null });
    }
  },

  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        set({ user: data.user as User, userType: (data.user.user_metadata?.user_type as 'student' | 'company' | undefined) || null });
        await get().fetchUserProfile();
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  },

  // Simplified signUp function
  signUp: async (email, password, userType, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType,
            full_name: fullName, // The trigger will use this data
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('Sign up successful, but no user data returned.');

      // The trigger function in Supabase now handles profile creation automatically.
      // We no longer need to insert into the 'students' table from here.

      // We can still set the user in the store and fetch the profile which was just created.
      set({ user: data.user as User });
      await get().fetchUserProfile();

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, profile: null, studentId: null, userType: null, companyProfile: null, companyId: null });
    } catch {
      console.error('Error signing out');
    }
  },

  checkSession: async () => {
    set({ loading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({ user: session.user as User, userType: (session.user.user_metadata?.user_type as 'student' | 'company' | undefined) || null });
        await get().fetchUserProfile();
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      set({ loading: false });
    }
  },
}));

// Listen for auth state changes to keep the store in sync
supabase.auth.onAuthStateChange((event, session) => {
  const { user, fetchUserProfile } = useAuthStore.getState();
  if (session?.user) {
    // If the user in the store is different, or there was no user before, update the session
    if (user?.id !== session.user.id) {
        useAuthStore.setState({ user: session.user as User, userType: (session.user.user_metadata?.user_type as 'student' | 'company' | undefined) || null });
        fetchUserProfile();
    }
  } else if (!session?.user && user) {
    // If there's no session but there is a user in the store, sign them out
    useAuthStore.setState({ user: null, profile: null, studentId: null, userType: null, companyProfile: null, companyId: null });
  }
});