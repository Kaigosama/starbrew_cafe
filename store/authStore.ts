import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { UserRole } from '../types';

interface AuthState {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  role: null,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      role: (session?.user?.user_metadata?.role as UserRole) ?? null,
    }),
}));
