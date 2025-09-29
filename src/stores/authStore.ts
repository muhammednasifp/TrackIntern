import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  user_metadata: {
    user_type?: 'student' | 'company';
  };
}

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, userType: 'student' | 'company') => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

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

      // --- Added code below ---
      // After successful sign up, update the user state to log them in automatically
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
      set({ user: null });
    } catch {
      console.error('Error signing out');
    }
  },

  checkSession: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({ user: session.user as User });
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
  } else {
    useAuthStore.setState({ user: null });
  }
});