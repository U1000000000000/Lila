/**
 * Auth Store — Zustand in-memory only (no localStorage / sessionStorage).
 *
 * The JWT lives exclusively in an HttpOnly cookie managed by the server.
 * JS cannot read HttpOnly cookies, so there is nothing sensitive to persist.
 * This store holds only the decoded public user profile (name, email,
 * picture) needed to render the UI — it is intentionally non-sensitive.
 *
 * On tab close or refresh: store resets → useAuth calls /auth/me →
 * server validates cookie → profile restored. Cost: one fast API call.
 *
 * Usage:
 *   import { useAuthStore } from "../store/authStore";
 *   const { user, setUser, clearUser } = useAuthStore();
 */
import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,

  /**
   * True while the initial /auth/me session-restore fetch is in flight.
   * Shared across ALL components so only one fetch ever fires, regardless of
   * how many components call useAuth() simultaneously on first mount.
   */
  isCheckingSession: false,

  /**
   * True once the very first /auth/me check has resolved (success or 401).
   * Prevents re-fetching on every render when the user is genuinely logged out.
   * Reset to false on logout so the next page load performs a fresh check.
   */
  sessionChecked: false,

  /** Cache the decoded public user profile ({email, name, picture, google_id}) */
  setUser: (user) => set({ user, isCheckingSession: false, sessionChecked: true }),

  /** Wipe auth state — called after server-side logout clears the cookie */
  clearUser: () => set({ user: null, isCheckingSession: false, sessionChecked: true }),

  /** Mark that a /auth/me fetch is in progress — prevents duplicate requests */
  beginSessionCheck: () => set({ isCheckingSession: true }),

  /** Reset session state on logout so the next visit performs a fresh check */
  resetSession: () => set({ user: null, isCheckingSession: false, sessionChecked: false }),
}));
