/**
 * Auth Store — Zustand (placeholder).
 * Will persist JWT token (with zustand/middleware persist) and user profile.
 *
 * import { create } from "zustand";
 * import { persist } from "zustand/middleware";
 *
 * export const useAuthStore = create(
 *   persist(
 *     (set) => ({
 *       token: null,
 *       user: null,
 *       setToken: (token) => set({ token }),
 *       setUser: (user) => set({ user }),
 *       clearToken: () => set({ token: null, user: null }),
 *     }),
 *     { name: "lila-auth" }
 *   )
 * );
 */

// Placeholder export
export const useAuthStore = () => ({
  token: null,
  user: null,
});
