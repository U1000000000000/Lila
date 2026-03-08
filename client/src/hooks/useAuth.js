/**
 * useAuth — HttpOnly cookie-backed auth state.
 *
 * Flow:
 *  1. AuthCallback is reached after Google OAuth redirect.
 *     The server has already set the JWT as an HttpOnly cookie —
 *     JS never touches the raw token.
 *  2. On first mount (no cached profile) we call /auth/me.
 *     The browser sends the HttpOnly cookie automatically.
 *  3. User profile is stored in Zustand memory only (no localStorage/
 *     sessionStorage) — JS cannot extract the JWT from the store;
 *     it only stores public profile info (name, email, picture).
 *  4. On logout we call POST /auth/logout so the server deletes the
 *     HttpOnly cookie (JS cannot delete HttpOnly cookies itself).
 */
import { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const { user, setUser, clearUser, resetSession, isCheckingSession, sessionChecked, beginSessionCheck } = useAuthStore();
  // loading is true only when we genuinely don't know the auth state yet.
  // If user is already in the store, or another component already kicked off
  // the /auth/me check, we surface loading=true to block protected renders.
  const [loading, setLoading] = useState(!user && !sessionChecked);

  useEffect(() => {
    // Already have a profile — nothing to do.
    if (user) {
      setLoading(false);
      return;
    }

    // We already confirmed this session has no valid cookie — do NOT re-fetch.
    // Prevents the 401-flood loop: clearUser sets sessionChecked=true, which
    // stops this effect from launching another /auth/me when it re-runs.
    if (sessionChecked) {
      setLoading(false);
      return;
    }

    // Another component already started the fetch — subscribe to Zustand and
    // wait; this component will re-render when user/sessionChecked changes.
    if (isCheckingSession) {
      return;
    }

    // We're first — claim the lock and start the fetch.
    beginSessionCheck();
    api.get("/auth/me")
      .then((res) => {
        if (res.user) {
          setUser(res.user);
        } else {
          clearUser();
        }
      })
      .catch(() => {
        // 401 = no valid cookie — user is not logged in.
        // clearUser sets sessionChecked=true, which stops any further fetches.
        clearUser();
      })
      .finally(() => {
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isCheckingSession, sessionChecked]);

  // Sync local loading state when the Zustand check completes from elsewhere.
  useEffect(() => {
    if (sessionChecked || user) setLoading(false);
  }, [user, sessionChecked]);

  async function logout() {
    // Server deletes the HttpOnly cookie — JS cannot do this itself.
    try {
      await api.post("/auth/logout", {});
    } catch {
      // Even if the request fails, clear local state so the UI resets.
    }
    // resetSession clears user and sets sessionChecked=false so the next
    // page load / navigation performs a fresh /auth/me check.
    resetSession();
  }

  return { isAuthenticated: !!user, user, loading, logout };
}
