import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  user_metadata: {
    user_type?: 'student' | 'company';
  };
}

// Define a simplified profile type for the store
interface StudentProfile {
  student_id: string;
  full_name: string;
  profile_strength: number;
}

interface AuthState {
  user: User | null;
  profile: StudentProfile | null; // Added
  studentId: string | null;      // Added
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, userType: 'student' | 'company') => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  fetchUserProfile: () => Promise<void>; // Added
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  studentId: null,
  loading: true,

  fetchUserProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('students')
        .select('student_id, full_name, profile_strength')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.log('No student profile found for this user yet.');
        set({ profile: null, studentId: null });
        return;
      }

      if (data) {
        set({ profile: data, studentId: data.student_id });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      set({ profile: null, studentId: null });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        set({ user: data.user as User });
        await get().fetchUserProfile(); // Fetch profile on sign-in
      }

      return { success: true };
    } catch {
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  signUp: async (email: string, password: string, userType: 'student' | 'company') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        set({ user: data.user as User });
      }

      return { success: true };
    } catch {
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, profile: null, studentId: null }); // Clear profile on sign out
    } catch {
      console.error('Error signing out');
    }
  },

  checkSession: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({ user: session.user as User });
        await get().fetchUserProfile(); // Fetch profile on session check
      }
      set({ loading: false });
    } catch (error) {
      console.error('Error checking session:', error);
      set({ loading: false });
    }
  },
}));

// Listen for auth changes
supabase.auth.onAuthStateChange((_, session) => {
  if (session?.user) {
    useAuthStore.setState({ user: session.user as User });
    useAuthStore.getState().fetchUserProfile(); // Fetch profile on auth state change
  } else {
    useAuthStore.setState({ user: null, profile: null, studentId: null });
  }
});