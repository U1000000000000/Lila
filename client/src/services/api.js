/**
 * API Service — centralised REST client.
 *
 * Auth strategy: HttpOnly cookie only.
 * The JWT is stored in an HttpOnly cookie set by the server after OAuth.
 * JS never reads or sends the token — `credentials: "include"` tells the
 * browser to attach the cookie automatically on every request.
 * No Authorization header is used or needed.
 *
 * Usage:
 *   import { api } from "./api";
 *   const user = await api.get("/auth/me");
 */

// In dev, always use relative URL so requests go through the Vite proxy.
// The proxy forwards them to the FastAPI backend, and the browser stores
// HttpOnly cookies for localhost:5173 — the correct origin for every
// subsequent proxied request.
// In production (same origin): relative URL still works.
// In production (cross-origin API): set VITE_API_BASE_URL=https://api.example.com/api/v1
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

/**
 * Wrap fetch with an AbortController timeout.
 * If the server does not respond within `timeoutMs`, the request is aborted
 * and an AbortError is thrown — the UI can then surface a meaningful error
 * state instead of hanging the tab indefinitely.
 * Default: 15 s (generous for auth calls, tight enough to catch hangs).
 */
function fetchWithTimeout(url, options, timeoutMs = 15_000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(id)
  );
}

export const api = {
  get: async (path) => {
    const res = await fetchWithTimeout(`${BASE_URL}${path}`, {
      // credentials: "include" sends the HttpOnly jwt_token cookie automatically.
      // Never add an Authorization header here — the token is HttpOnly.
      credentials: "include",
    });
    return handleResponse(res);
  },
  post: async (path, body) => {
    const res = await fetchWithTimeout(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },
  patch: async (path, body) => {
    const res = await fetchWithTimeout(`${BASE_URL}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
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

/**
 * Returns the raw chat history for a specific session.
 * Shape: { session_id, messages: [{role, content}] }
 */
export const fetchConversation = (sessionId) =>
  api.get(`/analysis/conversation/${sessionId}`);

