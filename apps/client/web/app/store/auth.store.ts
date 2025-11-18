import { create } from 'zustand';

type User = {
  id: string;
  name: string | null;
  email: string;
  role: 'guest' | 'admin';
};

type AuthState = {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },
}));
