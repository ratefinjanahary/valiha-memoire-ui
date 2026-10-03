import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole = 'PUBLIC' | 'ETUDIANT' | 'DOCUMENTALISTE' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true }),

      logout: () =>
        set({ user: null, token: null, isAuthenticated: false }),

      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'valiha-auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);