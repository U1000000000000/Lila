import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { Mic, Zap, Brain, Activity, ArrowRight } from "lucide-react";
import { cn } from "../utils/cn";
import Logo from "../components/ui/Logo";
import Footer from "../components/ui/Footer";

// Same noise URL as AppShell
const NOISE_URL = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

// ── Shared Animation Configs ──────────────────────────────────────────
const smoothEase = [0.16, 1, 0.3, 1]; // "Apple-like" fluid spring curve

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24, filter: "blur(8px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.9, ease: smoothEase, delay },
});

// ── Components: Premium Hover Card ────────────────────────────────────
function PremiumCard({ children, className, gradientColor = "#A78BFA" }) {
  const cardRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative rounded-[24px] bg-[#0A0A0A] border border-white/[0.04] overflow-hidden group transition-all duration-500",
        className,
      )}
    >
      {/* Subtle border glow that follows mouse */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, ${gradientColor}20, transparent 40%)`,
            }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 h-full p-8 md:p-10 flex flex-col justify-between">
        {children}
      </div>
    </motion.div>
  );
}

// ── Components: Magnetic Button ───────────────────────────────────────
function MagneticButton({ children, onClick, className, primary }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const { x, y } = position;

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.15, y: middleY * 0.15 });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        reset();
      }}
      onClick={onClick}
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={cn(
        "relative flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold transition-all duration-300 overflow-hidden",
        primary
          ? "bg-white hover:bg-[#A78BFA]"
          : "bg-transparent border border-white/[0.1] hover:bg-white/[0.03]",
        className,
      )}
    >
      <span
        className="relative z-10 flex items-center gap-2 transition-colors duration-200"
        style={{
          color: isHovered
            ? "#ffffff"
            : primary
              ? "#c9b2e6ff"
              : "rgba(255,255,255,0.8)",
        }}
      >
        {children}
      </span>
      {primary && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#A78BFA]/20 to-transparent pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  );
}

// ── Components: Login Button with Sweeping Glow ────────────────────────
function LoginButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative px-6 py-2.5 rounded-full overflow-hidden flex items-center justify-center backdrop-blur-md transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
    >
      {/* Background layer */}
      <div className="absolute inset-0 bg-white/[0.03] border border-white/[0.08] rounded-full group-hover:bg-white/[0.06] transition-colors" />

      {/* Hover sweeping glow underneath border */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full h-full w-full">
        <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_50%,#A78BFA_100%)] opacity-30" />
      </div>

      {/* Mask over sweep to create glowing border effect */}
      <div className="absolute inset-[1px] bg-black/90 rounded-full group-hover:bg-black/70 transition-colors duration-500" />

      <span className="relative z-10 text-[13px] font-medium text-white/90 tracking-wide">
        Log in
      </span>
    </button>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    return scrollY.on("change", (v) => setShowScrollTop(v > 400));
  }, [scrollY]);

  // Very subtle parallax
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroY = useTransform(scrollY, [0, 500], [0, 80]);

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col selection:bg-[#A78BFA]/30 relative overflow-x-hidden">
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

      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="absolute inset-x-0 top-0 z-50 h-28 flex items-center justify-between px-8 md:px-12 pointer-events-none">
        <div
          className="flex items-center gap-3 select-none cursor-pointer pointer-events-auto group"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <Logo
            className="w-8 h-8 transition-transform duration-500 group-hover:scale-110"
            glow
          />
          <span className="text-white/90 text-[20px] font-medium tracking-wide">
            Lila
          </span>
        </div>
        <div className="pointer-events-auto">
          <LoginButton onClick={() => navigate("/login")} />
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-24 px-6">
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 flex flex-col items-center text-center max-w-[800px] mx-auto w-full"
        >
          <motion.div
            {...fadeUp(0)}
            className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.04] mb-10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-md"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />
            <span className="text-[11px] font-medium text-white/60 tracking-widest uppercase">
              Lila Neural Engine
            </span>
          </motion.div>

          {/* Stark typography */}
          <motion.h1
            {...fadeUp(0.1)}
            className="text-[56px] sm:text-[72px] md:text-[96px] font-medium leading-[1.02] tracking-[-0.03em] text-white mb-8"
          >
            Language at the
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-[#A78BFA]/80">
              speed of thought.
            </span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.2)}
            className="text-[17px] md:text-[21px] text-white/40 leading-[1.5] max-w-[580px] mb-14 font-light tracking-tight"
          >
            No multiple choice. No artificial scenarios. Just real conversation
            powered by a sub-400ms neural voice model.
          </motion.p>

          <motion.div
            {...fadeUp(0.3)}
            className="flex flex-col sm:flex-row items-center gap-5"
          >
            <MagneticButton primary onClick={() => navigate("/login")}>
              Start Speaking Free <ArrowRight className="w-4 h-4 ml-1" />
            </MagneticButton>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Bento Grid ───────────────────────────────────────────── */}
      <section
        id="features"
        className="relative z-10 max-w-[1100px] mx-auto px-6 py-32"
      >
        <motion.div {...fadeUp(0)} className="mb-16">
          <h2 className="text-[32px] md:text-[40px] font-medium text-white mb-4 tracking-[-0.02em]">
            Precision Engineering.
          </h2>
          <p className="text-[16px] text-white/40 max-w-[480px] font-light">
            Designed to simulate native conversational pressure and build real
            neural pathways.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[280px]">
          {/* Card 1: Latency */}
          <PremiumCard className="md:col-span-2" gradientColor="#A78BFA">
            <div className="w-10 h-10 rounded-[12px] bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-6">
              <Zap className="w-4 h-4 text-[#A78BFA]" />
            </div>
            <div>
              <h3 className="text-[22px] font-medium text-white mb-2 tracking-tight">
                Zero Latency Flow
              </h3>
              <p className="text-[15px] text-white/40 leading-[1.6] max-w-[380px] font-light">
                Sub-400ms reply times. Lila speaks the moment you finish your
                sentence, removing the awkward "bot pause".
              </p>
            </div>
          </PremiumCard>

          {/* Card 2: Memory */}
          <PremiumCard gradientColor="#C4B5FD">
            <div className="w-10 h-10 rounded-[12px] bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-6">
              <Brain className="w-4 h-4 text-[#C4B5FD]" />
            </div>
            <div>
              <h3 className="text-[20px] font-medium text-white mb-2 tracking-tight">
                Layered Memory
              </h3>
              <p className="text-[14px] text-white/40 leading-[1.6] font-light">
                Remembers facts, themes, and shared history across sessions — no
                bloated prompts, just context that persists.
              </p>
            </div>
          </PremiumCard>

          {/* Card 3: Correction */}
          <PremiumCard gradientColor="#34D399">
            <div className="w-10 h-10 rounded-[12px] bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-6">
              <Activity className="w-4 h-4 text-[#34D399]" />
            </div>
            <div>
              <h3 className="text-[20px] font-medium text-white mb-2 tracking-tight">
                Deferred Analytics
              </h3>
              <p className="text-[14px] text-white/40 leading-[1.6] font-light">
                Post-session reports break down grammar, vocabulary, and
                fluency. The conversation itself is never interrupted.
              </p>
            </div>
          </PremiumCard>

          {/* Card 4: Voices */}
          <PremiumCard className="md:col-span-2" gradientColor="#A78BFA">
            <div className="w-10 h-10 rounded-[12px] bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-6">
              <Mic className="w-4 h-4 text-[#A78BFA]" />
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 h-full">
              <div className="flex-1">
                <h3 className="text-[22px] font-medium text-white mb-2 tracking-tight">
                  Hyper-Real Voices
                </h3>
                <p className="text-[15px] text-white/40 leading-[1.6] font-light max-w-[340px]">
                  Voices that breathe, emote, and adapt their cadence to your
                  learning pace.
                </p>
              </div>
              {/* Visual Audio Wave Abstraction */}
              <div className="flex items-end gap-[3px] h-12 flex-shrink-0 opacity-60">
                {[40, 80, 50, 100, 70, 90, 60, 40, 70, 50].map((h, i) => (
                  <motion.div
                    key={i}
                    className="w-[3px] rounded-t-sm bg-gradient-to-t from-[#A78BFA]/20 to-[#A78BFA]"
                    animate={{
                      height: [h * 0.3 + "px", h + "px", h * 0.3 + "px"],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.08,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            </div>
          </PremiumCard>
        </div>
      </section>

      {/* ── Simplicity ───────────────────────────────────────────── */}
      <section className="relative z-10 max-w-[800px] mx-auto px-6 py-32 border-t border-white/[0.03]">
        <motion.div {...fadeUp(0)} className="mb-20">
          <h2 className="text-[32px] md:text-[40px] font-medium text-white mb-4 tracking-[-0.02em]">
            Pure conversation.
          </h2>
          <p className="text-[16px] text-white/40 max-w-[400px] font-light">
            No gamification. No tapping. Just you and an entity designed to make
            you fluent.
          </p>
        </motion.div>

        <div className="flex flex-col gap-12 border-l border-white/[0.04] pl-8 md:pl-12 relative">
          {[
            {
              title: "Open & Speak",
              desc: "Start a session instantly. Zero setup required.",
            },
            {
              title: "Natural Dialogue",
              desc: "Talk about your day, explain a concept, or explore any topic. Lila listens and responds like a real conversation partner.",
            },
            {
              title: "Post-Session Insight",
              desc: "After the session, receive structured analytics: grammar errors, vocabulary range, fluency scores, and longitudinal progress.",
            },
          ].map((item, i) => (
            <motion.div {...fadeUp(0.1 + i * 0.1)} key={i} className="relative">
              {/* Timeline dot */}
              <div className="absolute -left-[37px] md:-left-[53px] top-1.5 w-2 h-2 rounded-full bg-white/[0.15] shadow-[0_0_10px_rgba(255,255,255,0.1)]" />

              <h3 className="text-[18px] font-medium text-white mb-2 tracking-tight">
                {item.title}
              </h3>
              <p className="text-[15px] text-white/40 leading-[1.6] max-w-[380px] font-light">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Final Call ───────────────────────────────────────────── */}
      <section className="relative min-h-[50vh] flex flex-col items-center justify-center px-6 py-32 border-t border-white/[0.03]">
        <motion.div {...fadeUp(0)} className="text-center w-full max-w-[500px]">
          <h2 className="text-[40px] md:text-[56px] font-medium text-white mb-8 tracking-[-0.03em] leading-[1.05]">
            Start speaking.
          </h2>
          <MagneticButton
            primary
            onClick={() => navigate("/login")}
            className="w-full sm:w-auto sm:min-w-[200px] mx-auto"
          >
            Create an Account
          </MagneticButton>
        </motion.div>
      </section>

      <Footer />

      {/* ── Scroll To Top ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 8 }}
            transition={{ duration: 0.25, ease: smoothEase }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-8 right-8 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-black/60 border border-white/[0.08] backdrop-blur-md text-white/50 hover:text-white hover:border-[#A78BFA]/50 hover:shadow-[0_0_18px_rgba(167,139,250,0.2)] transition-all duration-200"
            aria-label="Scroll to top"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 11V3M7 3L3 7M7 3L11 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
