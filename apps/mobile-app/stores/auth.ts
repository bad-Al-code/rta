import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const storage = createMMKV({ id: 'auth-storage' });
const zustandStorage = {
  setItem: (name: string, value: string) => {
    return storage.set(name, value);
  },

  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },

  removeItem: (name: string) => {
    return storage.remove(name);
  },
};

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      isAuthenticated: false,
      setToken: (token) => set({ accessToken: token, isAuthenticated: true }),
      logout: () => set({ accessToken: null, isAuthenticated: false }),
    }),

    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
