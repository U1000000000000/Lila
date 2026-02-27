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

// ── Analysis API ──────────────────────────────────────────────────────────────

/**
 * Returns aggregated dashboard stats for the authenticated user.
 * Shape: { total_sessions, total_time_seconds, average_fluency,
 *          vocabulary_growth, latest_cefr, fluency_history[],
 *          recent_grammar_errors[], recent_sessions[] }
 */
export const fetchDashboard = () => api.get("/analysis/dashboard");

/**
 * Returns paginated session analysis history.
 * Shape: { page, size, items: ConversationAnalysis[] }
 */
export const fetchHistory = (page = 1, size = 20) =>
  api.get(`/analysis/history?page=${page}&size=${size}`);

/**
 * Returns the full analysis for a single session (any status).
 * Shape: ConversationAnalysis
 */
export const fetchSessionAnalysis = (sessionId) =>
  api.get(`/analysis/session/${sessionId}`);
