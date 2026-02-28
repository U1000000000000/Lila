import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mic, Brain, Zap } from "lucide-react";
import AppShell from "../components/layout/AppShell";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut", delay },
});

function SectionTag({ children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-6 h-px bg-[#A78BFA]" />
      <span className="text-[10px] font-semibold tracking-[0.2em] text-[#A78BFA] uppercase">
        {children}
      </span>
    </div>
  );
}

export default function About() {
  const navigate = useNavigate();

  return (
    <AppShell activeNav="" noNav>
      {/* Override the nav by layering an About-specific nav on top is not needed — AppShell nav handles it.
          The "About" page just passes empty activeNav since it's outside the Home/History/Settings trio. */}

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-20 pb-28">
        <div className="relative mb-10">
          <div className="w-[180px] h-[180px] rounded-full bg-[#A78BFA]/[0.1] border border-[#A78BFA]/[0.12] flex items-center justify-center">
            <div className="w-[120px] h-[120px] rounded-full bg-[#A78BFA]/[0.15] flex items-center justify-center">
              <div className="w-[64px] h-[64px] rounded-full bg-[#A78BFA]/[0.22] flex items-center justify-center">
                <Mic className="w-6 h-6 text-[#A78BFA]" strokeWidth={1.8} />
              </div>
            </div>
          </div>
          <motion.div
            className="absolute inset-0 rounded-full bg-[#A78BFA] blur-[60px] opacity-[0.08]"
            animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.14, 0.08] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <motion.h1
          {...fadeUp(0)}
          className="text-[42px] md:text-[54px] font-bold leading-[1.15] text-white max-w-[560px] mb-5"
        >
          Learning, at the speed of{" "}
          <span className="text-[#A78BFA]">thought.</span>
        </motion.h1>
        <motion.p
          {...fadeUp(0.1)}
          className="text-[14px] text-white/35 max-w-[290px] leading-relaxed"
        >
          A real-time fluency partner engineered to feel human.
          <br />
          Conversation uninterrupted. Feedback structured.
        </motion.p>

        <motion.button
          {...fadeUp(0.2)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/login")}
          className="mt-8 px-7 py-3 rounded-full bg-[#A78BFA] hover:bg-[#9b77fa] text-white text-[14px] font-semibold transition-colors shadow-[0_4px_24px_rgba(167,139,250,0.3)]"
        >
          Try Lila
        </motion.button>
      </section>

      {/* ── Philosophy ────────────────────────────────────── */}
      <section
        id="philosophy"
        className="max-w-[680px] mx-auto px-8 py-12 w-full border-t border-white/[0.05]"
      >
        <motion.div {...fadeUp(0)}>
          <SectionTag>Philosophy</SectionTag>
          <h2 className="text-[22px] font-bold text-white mb-4 leading-snug">
            We believe language is best learned through{" "}
            <span className="text-[#A78BFA]">immersion</span>, not multiple
            choice.
          </h2>
          <p className="text-[13px] text-white/40 leading-[1.9]">
            Modern language apps interrupt your flow with corrections, badges,
            and taps. Lila removes all of that. Every architectural decision —
            from streaming speech recognition to layered memory and personality
            constraints — is optimized to preserve conversational flow and
            reduce performance anxiety. You focus on speaking. Structured
            feedback comes after.
          </p>
        </motion.div>
      </section>

      {/* ── Technology ────────────────────────────────────── */}
      <section
        id="technology"
        className="max-w-[680px] mx-auto px-8 py-8 w-full"
      >
        <motion.div {...fadeUp(0)}>
          <SectionTag>The Tech</SectionTag>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                icon: Brain,
                title: "Contextual LLM",
                desc: "Lila remembers your previous conversations, adapting her vocabulary and topics to your specific interests and proficiency level.",
              },
              {
                icon: Zap,
                title: "Low-Latency Synthesis",
                desc: "Powered by our proprietary neural engine, Lila responds in under 400ms, maintaining the natural cadence of human speech.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-[14px] bg-white/[0.03] border border-white/[0.07] p-5 hover:bg-white/[0.05] transition-colors"
              >
                <div className="w-8 h-8 rounded-[8px] bg-[#A78BFA]/[0.12] flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-[#A78BFA]" strokeWidth={1.8} />
                </div>
                <h3 className="text-[14px] font-semibold text-white/85 mb-2">
                  {title}
                </h3>
                <p className="text-[12px] text-white/35 leading-[1.7]">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Voice ─────────────────────────────────────────── */}
      <section id="voice" className="max-w-[680px] mx-auto px-8 py-12 w-full">
        <motion.div {...fadeUp(0)}>
          <SectionTag>The Voice</SectionTag>
          <div className="rounded-[16px] bg-white/[0.03] border border-white/[0.07] p-6">
            <div className="flex-1">
              <h3 className="text-[18px] font-semibold text-white mb-3">
                Calm, Patient, Adaptive.
              </h3>
              <p className="text-[13px] text-white/40 leading-[1.8]">
                Lila is a non-judgmental conversation partner. She never
                interrupts to correct you mid-sentence. The conversation stays
                natural and unbroken. After the session, structured analytics
                break down your grammar, vocabulary range, and fluency — so
                improvement becomes measurable without ever disrupting flow.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="flex flex-col items-center text-center px-6 py-20 border-t border-white/[0.05]">
        <motion.div {...fadeUp(0)}>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-white/25 uppercase mb-4">
            Ready to Speak?
          </p>
          <motion.button
            whileHover={{ x: 4 }}
            onClick={() => navigate("/login")}
            className="text-[28px] md:text-[34px] font-bold text-white hover:text-[#A78BFA] transition-colors duration-300"
          >
            Start a conversation →
          </motion.button>
        </motion.div>
      </section>
    </AppShell>
  );
}
