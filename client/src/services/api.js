/**
 * API Service — centralised REST client.
 * Wraps fetch with JWT auth header injection and base URL resolution.
 *
 * Usage:
 *   import { api } from "./api";
 *   const user = await api.get("/users/me");
 */

// Base URL draws from environment variable in production, but uses Vite Proxy (/api/v1) in local dev.
const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

/** Read JWT from sessionStorage and return as Authorization header. */
function authHeaders() {
  const token = sessionStorage.getItem("jwt_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  get: async (path) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      credentials: "include",
      headers: { ...authHeaders() },
    });
    return handleResponse(res);
  },
  post: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      credentials: "include",
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  patch: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      credentials: "include",
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
};
