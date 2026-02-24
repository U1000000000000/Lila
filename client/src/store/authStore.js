/**
 * Auth Store — Zustand with sessionStorage persistence.
 * Holds the decoded user profile after Google OAuth.
 *
 * Usage:
 *   import { useAuthStore } from "../store/authStore";
 *   const { user, setUser, clearUser } = useAuthStore();
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,

      /** Store a decoded user profile ({email, name, google_id, …}) */
      setUser: (user) => set({ user }),

      /** Wipe auth state on logout */
      clearUser: () => set({ user: null }),
    }),
    {
      name: "lila-auth",
      // Use sessionStorage so state is cleared when the browser tab closes
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
