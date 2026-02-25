/**
 * AuthCallback — landing page for the Google OAuth redirect.
 *
 * The backend redirects here as:
 *   [VITE_FRONTEND_URL]/auth/callback?token=<JWT>
 *
 * We store the token in sessionStorage so it persists across page refreshes
 * within the same browser tab, then navigate to /chat.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      sessionStorage.setItem("jwt_token", token);
      // Clean the token out of the URL before navigating (security hygiene)
      navigate("/chat", { replace: true });
    } else {
      // No token? Something went wrong — send back to login
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <p className="text-gray-400">Completing sign-in…</p>
    </div>
  );
}
