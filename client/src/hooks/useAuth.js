/**
 * useAuth — JWT + Zustand-backed auth state.
 *
 * Flow:
 *  1. AuthCallback stores the raw token in sessionStorage.
 *  2. On first mount we call /auth/me to decode the token server-side and
 *     cache the user profile in the Zustand authStore.
 *  3. Subsequent renders read from the store (no extra network call).
 */
import { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const { user, setUser, clearUser } = useAuthStore();
  const [loading, setLoading] = useState(!user); // skip fetch if already cached

  useEffect(() => {
    // Already have a cached profile — no need to re-fetch
    if (user) return;

    const token = sessionStorage.getItem("jwt_token");
    if (!token) {
      setLoading(false);
      return;
    }

    api.get("/auth/me")
      .then((res) => {
        if (res.user) {
          setUser(res.user);
        } else {
          // Token was rejected by the server
          sessionStorage.removeItem("jwt_token");
          clearUser();
        }
      })
      .catch(() => {
        clearUser();
      })
      .finally(() => {
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function logout() {
    sessionStorage.removeItem("jwt_token");
    clearUser();
  }

  return { isAuthenticated: !!user, user, loading, logout };
}
