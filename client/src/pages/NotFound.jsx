import { useNavigate } from "react-router-dom";
import Logo from "../components/ui/Logo";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans relative flex flex-col items-center justify-center selection:bg-[#A78BFA]/30 selection:text-white overflow-hidden">
      {/* Ambient Noise */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-screen"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* Glowing Orbs */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#A78BFA] rounded-full opacity-[0.04] blur-[120px] pointer-events-none z-0 animate-pulse"
        style={{ animationDuration: "14s" }}
      ></div>

      {/* Main Content Card */}
      <div className="w-full max-w-[440px] px-6 z-10 animate-fade-in-up text-center">
        <div className="mb-10 flex justify-center">
          <Logo
            className="w-24 h-24 drop-shadow-[0_0_20px_rgba(167,139,250,0.3)] transition-transform duration-700 hover:scale-110"
            glow
          />
        </div>

        <h1 className="text-[72px] leading-tight font-semibold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 mb-2">
          404
        </h1>
        <h2 className="text-[24px] font-medium text-white/90 mb-4 tracking-tight">
          Page Not Found
        </h2>
        <p className="text-[#8A8A8A] text-[15px] mb-10 leading-relaxed mx-auto max-w-[300px]">
          The page you are looking for doesn't exist in our dictionary. Let's
          get you back on track.
        </p>

        <button
          onClick={() => navigate("/")}
          className="group relative inline-flex items-center justify-center h-[52px] px-8 bg-white/[0.05] border border-white/[0.1] rounded-[14px] text-white/90 font-medium text-[15px] transition-all duration-300 ease-out hover:bg-white/[0.08] hover:border-[#A78BFA]/40 hover:text-white hover:shadow-[0_0_30px_rgba(124,92,255,0.15)] focus:outline-none focus:ring-2 focus:ring-[#A78BFA]/50 focus:ring-offset-2 focus:ring-offset-[#0A0A0A] active:scale-[0.98] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
          <span className="relative z-10">Return Home</span>
        </button>
      </div>

      <div className="absolute bottom-12 flex items-center justify-center gap-3 text-[#555555] text-[11px] font-medium uppercase tracking-[0.2em] z-10 select-none">
        <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-[#333]"></div>
        <span>Lost in Translation</span>
        <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-[#333]"></div>
      </div>
    </div>
  );
}
