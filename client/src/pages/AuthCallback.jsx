/**
 * AuthCallback — landing page for the Google OAuth redirect.
 *
 * Flow:
 *  1. Backend redirects here as /auth/callback?code=<one-time-code>
 *  2. We POST the code to /auth/exchange (through the Vite proxy).
 *  3. The exchange response sets the HttpOnly jwt_token cookie AND returns
 *     the user profile — JS never sees the raw JWT.
 *  4. We store the profile in Zustand and navigate to /chat.
 *
 * Why the code-exchange pattern?
 *  The backend OAuth callback runs on localhost:8000. If it set the cookie
 *  directly in the 302 redirect response the browser would store it as
 *  host-only for :8000, and it would never be included in requests the
 *  React app makes through the Vite proxy on :5173. By exchanging the code
 *  via a normal fetch (which goes through the proxy), the Set-Cookie in the
 *  response is attributed to :5173 and travels with every proxied API call.
 */
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  // Guard against React StrictMode double-invocation.
  // StrictMode mounts → unmounts → remounts in dev, firing useEffect twice.
  // The one-time code is consumed on the first call; without this guard the
  // second call gets a 400, catches, and navigates back to /login — undoing
  // the successful login that just happened.
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
      navigate("/login", { replace: true });
      return;
    }

    // Exchange code → HttpOnly cookie + user profile (via Vite proxy)
    api.post("/auth/exchange", { code })
      .then((res) => {
        if (res.user) {
          setUser(res.user);
          navigate("/chat", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
      })
      .catch(() => {
        navigate("/login", { replace: true });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
      <p className="text-white/30 text-[13px] font-light tracking-wide">
        Completing sign-in…
      </p>
    </div>
  );
}
