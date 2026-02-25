/**
 * Login page — Google OAuth only.
 * If the user is already authenticated, redirect them straight to /chat.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Logo from "../components/ui/Logo";

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
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center font-sans"></div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans relative flex flex-col items-center justify-center selection:bg-[#A78BFA]/30 selection:text-white overflow-hidden">
      {/* --- Ambient Background Layer --- */}
      {/* 1. Base Subtle Texture/Noise (Optional but adds depth) */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-screen"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* 2. Deep purple glowing orbs (Animated) */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[900px] md:h-[900px] bg-[#A78BFA] rounded-full opacity-[0.06] blur-[120px] pointer-events-none z-0 animate-pulse"
        style={{ animationDuration: "13s" }}
      ></div>
      <div className="absolute top-[40%] left-[60%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[400px] bg-[#8B5CF6] rounded-full opacity-[0.04] blur-[100px] pointer-events-none z-0"></div>

      {/* --- Header / Logo --- */}
      <div
        className="absolute top-8 left-8 md:top-12 md:left-12 flex items-center gap-3 select-none z-20 opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
        onClick={() => navigate("/")}
      >
        <Logo className="w-8 h-8" glow />
        <span className="text-white/90 text-[20px] font-medium tracking-wide">
          Lila
        </span>
      </div>

      {/* --- Main Authentication Card --- */}
      <div className="w-full max-w-[440px] px-6 z-10 animate-fade-in-up">
        {/* Glow behind the card */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#A78BFA]/10 to-transparent blur-xl -z-10 rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

        <div className="relative bg-[#0A0A0A]/80 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-[24px] p-10 md:p-12 overflow-hidden">
          {/* Subtle top inner highlight */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent"></div>

          <div className="flex flex-col items-center text-center">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <Logo
                className="w-16 h-16 drop-shadow-[0_0_15px_rgba(167,139,250,0.4)]"
                glow
              />
            </div>

            <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight text-white/95 mb-3 leading-tight">
              Access Lila
            </h1>
            <p className="text-[#8A8A8A] text-[15px] mb-10 leading-relaxed max-w-[280px]">
              Sign in or create an account to begin your language journey.
            </p>

            <button
              onClick={handleGoogleLogin}
              className="group relative w-full flex items-center justify-center h-[54px] px-4 bg-white/[0.03] border border-white/[0.08] rounded-[14px] text-white/90 font-medium text-[15px] transition-all duration-300 ease-out hover:bg-white/[0.06] hover:border-[#A78BFA]/50 hover:text-white hover:shadow-[0_0_24px_rgba(124,92,255,0.15)] focus:outline-none focus:ring-2 focus:ring-[#A78BFA]/50 focus:ring-offset-2 focus:ring-offset-[#0A0A0A] active:scale-[0.98] overflow-hidden"
            >
              {/* Button hover gradient sweep effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>

              {/* Monochromatic Google Icon that reveals identity on hover */}
              <svg
                className="w-[20px] h-[20px] mr-3 opacity-70 grayscale transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100 relative z-10"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="relative z-10">Continue with Google</span>
            </button>

            <div className="mt-8 flex items-center justify-center gap-2 text-[#555555] text-[13px] font-medium uppercase tracking-widest">
              <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-[#333]"></div>
              <span>Voice First Learning</span>
              <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-[#333]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
