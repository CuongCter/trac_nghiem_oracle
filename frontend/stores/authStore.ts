"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types/user";
import type { Role } from "@/lib/constants";
import { setToken, setUser, clearAuth } from "@/lib/storage";

interface AuthStoreState {
  user: User | null;
  token: string | null;
  isHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setHydrated: (v: boolean) => void;
  hasRole: (roles: Role[]) => boolean;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isHydrated: false,
      setAuth: (user, token) => {
        setToken(token);
        setUser(user);
        set({ user, token });
      },
      setUser: (user) => {
        setUser(user);
        set({ user });
      },
      logout: () => {
        clearAuth();
        set({ user: null, token: null });
      },
      setHydrated: (v) => set({ isHydrated: v }),
      hasRole: (roles) => {
        const { user } = get();
        return !!user && roles.includes(user.role);
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          };
        }
        return window.localStorage;
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    },
  ),
);
