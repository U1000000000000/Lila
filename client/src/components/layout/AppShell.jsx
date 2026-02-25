/**
 * AppShell — shared page wrapper used by Dashboard, History, Settings & About.
 * Provides: black bg, ambient noise, drifting orbs, sticky nav, footer.
 *
 * Props:
 *   activeNav  — "Dashboard" | "History" | "Settings" | ""
 *   children   — page main content
 *   noNav      — if true, renders the About-style simple nav instead
 */
import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Logo from "../ui/Logo";
import Footer from "../ui/Footer";
import { cn } from "../../utils/cn";
import { useAuth } from "../../hooks/useAuth";

const NAV_ITEMS = ["Dashboard", "History", "Settings"];

const NOISE_URL = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export default function AppShell({
  activeNav = "Dashboard",
  children,
  noNav = false,
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleNav = (item) => {
    if (item === "Dashboard") navigate("/dashboard");
    if (item === "History") navigate("/history");
    if (item === "Settings") navigate("/settings");
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col selection:bg-[#A78BFA]/30">
      {/* ── Ambient background (fixed so it doesn't scroll) ─── */}
      <div
        className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-screen"
        style={{ backgroundImage: NOISE_URL }}
      />
      <motion.div
        className="fixed top-1/3 left-1/4 w-[640px] h-[640px] bg-[#A78BFA] rounded-full opacity-[0.05] blur-[140px] pointer-events-none z-0"
        animate={{ x: [0, 28, -18, 0], y: [0, -18, 28, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="fixed top-2/3 right-1/4 w-[380px] h-[380px] bg-[#7C3AED] rounded-full opacity-[0.04] blur-[120px] pointer-events-none z-0"
        animate={{ x: [0, -22, 18, 0], y: [0, 22, -18, 0] }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
      />

      {/* ── Absolutely Positioned Header to Match Login ────────────────── */}
      <header className="absolute inset-x-0 top-0 z-30 h-24 pointer-events-none">
        {/* Left: Logo */}
        <div
          className="absolute top-8 left-8 md:top-12 md:left-12 flex items-center gap-3 select-none cursor-pointer pointer-events-auto opacity-90 hover:opacity-100 transition-opacity"
          onClick={() => {
            if (sessionStorage.getItem("jwt_token")) {
              navigate("/chat");
            } else {
              navigate("/");
            }
          }}
        >
          <Logo className="w-8 h-8" glow />
          <span className="text-white/90 text-[20px] font-medium tracking-wide">
            Lila
          </span>
        </div>

        {/* Center: Nav links — hidden on static/public pages */}
        {!noNav && (
          <nav className="absolute top-8 left-1/2 -translate-x-1/2 md:top-12 flex items-center gap-1 pointer-events-auto bg-black/40 backdrop-blur-md rounded-full px-2 py-1.5 border border-white/[0.06]">
            {NAV_ITEMS.map((item) => (
              <button
                key={item}
                onClick={() => handleNav(item)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 relative",
                  activeNav === item
                    ? "text-white bg-white/[0.08]"
                    : "text-white/40 hover:text-white/70",
                )}
              >
                {item}
              </button>
            ))}
          </nav>
        )}

        {/* Right side — logout button, hidden on static/public pages */}
        {!noNav && (
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="absolute top-8 right-8 md:top-12 md:right-12 pointer-events-auto px-4 py-1.5 rounded-full text-[13px] font-medium text-white/40 hover:text-white/80 border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-200 backdrop-blur-md"
          >
            Log out
          </button>
        )}
      </header>

      {/* ── Page content ───────────────────────────────────── */}
      <main className="relative z-10 flex-1 pt-32">{children}</main>

      <Footer />
    </div>
  );
}
