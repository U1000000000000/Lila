/**
 * Login page — Google OAuth only.
 * If the user is already authenticated, redirect them straight to /chat.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/chat");
    }
  }, [loading, isAuthenticated, navigate]);

  const handleGoogleLogin = () => {
    // Relative URL — goes through Vite proxy to the backend
    window.location.href = "/api/v1/auth/google/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-gray-400">Checking session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded shadow-lg flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-4">Sign in to continue</h2>
        <button
          onClick={handleGoogleLogin}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded shadow flex items-center"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.805 10.023h-9.765v3.977h5.568c-.238 1.272-1.41 3.74-5.568 3.74-3.342 0-6.065-2.76-6.065-6.14 0-3.38 2.723-6.14 6.065-6.14 1.9 0 3.18.81 3.915 1.5l2.67-2.62c-1.73-1.61-3.95-2.6-6.585-2.6-5.522 0-10.01 4.49-10.01 10.01s4.488 10.01 10.01 10.01c5.522 0 9.18-3.87 9.18-9.34 0-.63-.07-1.25-.18-1.83z" fill="#fff"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
