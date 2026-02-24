/**
 * useAuth — placeholder.
 * Will manage JWT token, login/logout state, and protected routes.
 */
// import { useState } from "react";
// import { useAuthStore } from "../store/authStore";
// import { api } from "../services/api";
// import jwt_decode from "jwt-decode";

// export function useAuth() {
//   const { token, setToken, clearToken } = useAuthStore();
//
//   async function login(email, password) { ... }
//   async function register(email, password) { ... }
//   function logout() { clearToken(); }
//
//   return { token, login, register, logout, isAuthenticated: !!token };
// }

import { useState, useEffect } from "react";
import { api } from "../services/api";

export function useAuth() {
  // Token is stored in sessionStorage (put there by AuthCallback page after
  // Google OAuth redirects back with ?token=JWT). The api service reads it
  // and sends it as an Authorization: Bearer header — no cross-origin cookie issues.
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("jwt_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api.get("/auth/me")
      .then(res => {
        setUser(res.user || null);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function logout() {
    sessionStorage.removeItem("jwt_token");
    setUser(null);
  }

  return { isAuthenticated: !!user, user, loading, logout };
}
