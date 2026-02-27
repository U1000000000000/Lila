import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Mic,
  Volume2,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Clock,
  Target,
  BookOpen,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { cn } from "../utils/cn";
import { fetchDashboard } from "../services/api";

const CEFR_COLOR = {
  A1: "#F87171", A2: "#FB923C",
  B1: "#FACC15", B2: "#34D399",
  C1: "#60A5FA", C2: "#A78BFA",
};

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return { h, m };
}

function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function FluentyChart({ data = [] }) {
  const chartData = data.length > 0 ? data : [0];
  const w = 140;
  const h = 60;
  const max = Math.max(...chartData, 1);
  const pts = chartData.map((v, i) => {
    const x = (i / Math.max(chartData.length - 1, 1)) * w;
    const y = h - (v / max) * h * 0.85 - 4;
    return `${x},${y}`;
  }).join(" ");
  const area = `0,${h} ${pts} ${w},${h}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#chartGrad)" />
      <polyline
        points={pts}
        fill="none"
        stroke="#A78BFA"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Last dot */}
      {(() => {
        const last = chartData.length - 1;
        const x = w;
        const y = h - (chartData[last] / max) * h * 0.85 - 4;
        return <circle cx={x} cy={y} r="2.5" fill="#A78BFA" />;
      })()}
    </svg>
  );
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut", delay },
});

export default function Dashboard() {
  const navigate = useNavigate();
  const [chartPeriod, setChartPeriod] = useState("W");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard()
      .then(setStats)
      .catch((e) => console.error("Dashboard fetch failed:", e))
      .finally(() => setLoading(false));
  }, []);

  // Derived display values from real data
  const time = stats ? formatTime(stats.total_time_seconds) : { h: 0, m: 0 };
  const STATS_CARDS = [
    { icon: LayoutDashboard, label: "SESSIONS", value: stats?.total_sessions ?? "—", color: "#A78BFA" },
    { icon: Clock, label: "TIME", value: `${time.h} ${time.m}`, sub: "h  m", color: "#60A5FA" },
    { icon: Target, label: "ACCURACY", value: stats ? `${Math.round(stats.average_fluency)}` : "—", sub: "%", color: "#34D399" },
    { icon: BookOpen, label: "VOCAB", value: stats ? `+${stats.vocabulary_growth}` : "—", color: "#F472B6" },
  ];

  return (
    <AppShell activeNav="Dashboard">
      <div className="max-w-[860px] w-full mx-auto px-6 py-8">
        {/* Progress header */}
        <motion.div
          {...fadeUp(0)}
          className="flex items-center justify-between mb-6"
        >
          <h1 className="text-[28px] font-semibold text-white mb-1">
            Your Progress
          </h1>
          <div className="flex items-center gap-1">
            {["Last 7 Days", "Month", "All"].map((p, i) => (
              <button
                key={p}
                className={cn(
                  "px-3 py-1 text-[11px] rounded-full transition-all duration-200",
                  i === 0
                    ? "text-white/70 bg-white/[0.06]"
                    : "text-white/30 hover:text-white/50",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stats + Chart row */}
        <div className="grid grid-cols-[1fr_200px] gap-4 mb-4">
          {/* Stats cards */}
          <motion.div {...fadeUp(0.05)} className="grid grid-cols-4 gap-3">
            {STATS_CARDS.map(({ icon: Icon, label, value, sub, color }) => (
              <div
                key={label}
                className="rounded-[14px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm px-4 py-4 flex flex-col gap-2 hover:bg-white/[0.07] transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-white/30 tracking-[0.1em] uppercase">
                    {label}
                  </span>
                  <Icon
                    className="w-3.5 h-3.5"
                    style={{ color, opacity: 0.6 }}
                    strokeWidth={2}
                  />
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[28px] font-bold text-white leading-none">
                    {loading ? "…" : value}
                  </span>
                  {sub && (
                    <span className="text-[12px] text-white/30 ml-0.5">
                      {sub}
                    </span>
                  )}
                </div>
                <div
                  className="h-0.5 rounded-full"
                  style={{ background: color, opacity: 0.3 }}
                />
              </div>
            ))}
          </motion.div>

          {/* Fluency Score Card */}
          <motion.div
            {...fadeUp(0.1)}
            className="rounded-[14px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm px-4 py-4 flex flex-col"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-semibold text-white/80">
                Fluency Score
              </span>
              <div className="flex gap-1">
                {["W", "M", "Y"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setChartPeriod(p)}
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded transition-all",
                      chartPeriod === p
                        ? "bg-white/10 text-white/80"
                        : "text-white/20 hover:text-white/40",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-h-[60px]">
              <FluentyChart data={stats?.fluency_history ?? []} />
            </div>
            <div className="flex justify-between mt-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <span key={d} className="text-[9px] text-white/20">
                  {d}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom two-column layout */}
        <div className="grid grid-cols-[1fr_200px] gap-4">
          {/* Areas to Improve — real grammar errors from analysis */}
          <motion.div {...fadeUp(0.15)}>
            <h2 className="text-[14px] font-semibold text-white/80 mb-3">
              Recent Grammar Errors
            </h2>
            <div className="flex flex-col gap-3">
              {loading ? (
                <div className="text-[12px] text-white/25 py-4 text-center">Loading…</div>
              ) : !stats?.recent_grammar_errors?.length ? (
                <div className="rounded-[14px] bg-white/[0.04] border border-white/[0.08] px-4 py-6 text-center text-[12px] text-white/25">
                  No grammar errors recorded yet. Start a conversation!
                </div>
              ) : (
                stats.recent_grammar_errors.map((err, i) => (
                  <div
                    key={i}
                    className="rounded-[14px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm px-4 py-3 hover:bg-white/[0.07] transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-[9px] font-bold tracking-[0.12em] px-2 py-0.5 rounded-full"
                        style={{ background: "#A78BFA22", color: "#A78BFA" }}
                      >
                        GRAMMAR
                      </span>
                    </div>
                    <div className="flex items-start gap-2 mb-1">
                      <span className="mt-0.5 text-red-400 text-[11px]">✗</span>
                      <span className="text-[13px] leading-snug text-white/35 line-through">
                        {err.original}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 mb-1">
                      <span className="mt-0.5 text-green-400 text-[11px]">✓</span>
                      <span className="text-[13px] leading-snug text-white/75">
                        {err.corrected}
                      </span>
                    </div>
                    {err.explanation && (
                      <p className="text-[10px] text-white/25 mt-1">{err.explanation}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Recent Sessions — real data */}
          <motion.div {...fadeUp(0.2)}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[14px] font-semibold text-white/80">
                Recent Sessions
              </h2>
              <button
                onClick={() => navigate("/history")}
                className="text-[11px] text-[#A78BFA] hover:text-white transition-colors"
              >
                View All
              </button>
            </div>
            <div className="flex flex-col gap-2 mb-4">
              {loading ? (
                <div className="text-[12px] text-white/25 py-4 text-center">Loading…</div>
              ) : !stats?.recent_sessions?.length ? (
                <div className="rounded-[12px] bg-white/[0.04] border border-white/[0.08] px-3 py-4 text-center text-[11px] text-white/25">
                  No sessions yet.
                </div>
              ) : (
                stats.recent_sessions.map((s, i) => {
                  const cefrColor = CEFR_COLOR[s.cefr_level] ?? "#A78BFA";
                  return (
                    <div
                      key={s.session_id ?? i}
                      className="rounded-[12px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm px-3 py-2.5 hover:bg-white/[0.07] transition-colors duration-200 cursor-pointer"
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className="mt-0.5 w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            background: cefrColor,
                            boxShadow: `0 0 6px ${cefrColor}60`,
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[12px] font-medium text-white/85 truncate">
                              {s.session_title || "Untitled Session"}
                            </span>
                            <span className="text-[10px] text-white/25 flex-shrink-0">
                              {s.analysed_at ? timeAgo(s.analysed_at) : ""}
                            </span>
                          </div>
                          <p className="text-[10px] text-white/35 mt-0.5 leading-snug line-clamp-2">
                            {s.session_summary}
                          </p>
                          <div className="flex gap-1 mt-1.5">
                            {s.cefr_level && (
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.05]"
                                style={{ color: cefrColor }}
                              >
                                {s.cefr_level}
                              </span>
                            )}
                            {(s.topics ?? []).slice(0, 2).map((t) => (
                              <span
                                key={t}
                                className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.05] text-white/30"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Start New Session CTA */}
            <motion.button
              onClick={() => navigate("/chat")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-[14px] bg-[#A78BFA] hover:bg-[#9b77fa] text-white text-[13px] font-semibold transition-colors duration-200 shadow-[0_4px_24px_rgba(167,139,250,0.3)]"
            >
              <Mic className="w-[14px] h-[14px]" strokeWidth={2.5} />
              Start New Session
            </motion.button>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
