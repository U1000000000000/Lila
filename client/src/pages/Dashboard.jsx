import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  TrendingUp,
  Clock,
  Target,
  BookOpen,
  Flame,
  Star,
  ChevronRight,
  Volume2,
  AlertTriangle,
  CheckCircle2,
  Zap,
  MessageSquare,
  Hash,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { cn } from "../utils/cn";
import { fetchDashboard } from "../services/api";
import { useAuth } from "../hooks/useAuth";

// ── Constants ──────────────────────────────────────────────────────────────────

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const CEFR_COLOR = {
  A1: "#F87171",
  A2: "#FB923C",
  B1: "#FACC15",
  B2: "#34D399",
  C1: "#60A5FA",
  C2: "#A78BFA",
};

const CEFR_LABEL = {
  A1: "Beginner",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper-Int",
  C1: "Advanced",
  C2: "Mastery",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return { h, m };
}

function timeAgo(isoString) {
  if (!isoString) return "";
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function fluencyColor(score) {
  if (score >= 75) return "#34D399";
  if (score >= 50) return "#FACC15";
  if (score >= 30) return "#FB923C";
  return "#F87171";
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ── Fluency Sparkline Chart ────────────────────────────────────────────────────

function FluencyChart({ data = [] }) {
  const [hovered, setHovered] = useState(null);
  const chartData =
    data.length > 1 ? data : data.length === 1 ? [data[0], data[0]] : [0, 0];
  const W = 100;
  const H = 100;
  const max = Math.max(...chartData, 1);
  const min = Math.min(...chartData, 0);
  const range = max - min || 1;

  const pts = chartData.map((v, i) => {
    const x = (i / (chartData.length - 1)) * W;
    const y = H - ((v - min) / range) * H * 0.8 - H * 0.1;
    return { x, y, v };
  });

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `0,${H} ${polyline} ${W},${H}`;

  return (
    <div className="relative w-full h-full" style={{ minHeight: 80 }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full"
        preserveAspectRatio="none"
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id="flGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#flGrad)" />
        <polyline
          points={polyline}
          fill="none"
          stroke="#A78BFA"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="2"
            fill={i === pts.length - 1 ? "#A78BFA" : "transparent"}
            stroke={hovered === i ? "#A78BFA" : "transparent"}
            strokeWidth="1.5"
            onMouseEnter={() => setHovered(i)}
            style={{ cursor: "pointer" }}
          />
        ))}
      </svg>
      {hovered !== null && (
        <div
          className="absolute -top-7 text-[10px] bg-white/10 backdrop-blur-sm border border-white/10 rounded-md px-1.5 py-0.5 text-white pointer-events-none"
          style={{
            left: `${(hovered / (pts.length - 1)) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {pts[hovered].v}
        </div>
      )}
    </div>
  );
}

// ── CEFR Journey Rail ──────────────────────────────────────────────────────────

function CEFRJourney({ currentLevel }) {
  const idx = CEFR_LEVELS.indexOf(currentLevel);
  const fillPct = idx < 0 ? 0 : ((idx + 0.5) / CEFR_LEVELS.length) * 100;

  return (
    <div className="w-full">
      {/* Rail */}
      <div className="relative h-1.5 rounded-full bg-white/[0.07] mb-3">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            background:
              "linear-gradient(90deg, #F87171, #FACC15, #34D399, #A78BFA)",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${fillPct}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </div>
      {/* Level nodes */}
      <div className="flex justify-between">
        {CEFR_LEVELS.map((lvl, i) => {
          const isActive = lvl === currentLevel;
          const isPast = i < idx;
          const color = CEFR_COLOR[lvl];
          return (
            <div key={lvl} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border transition-all duration-300",
                  isActive
                    ? "border-transparent scale-110 shadow-lg"
                    : isPast
                      ? "border-transparent opacity-60"
                      : "border-white/10 bg-white/[0.03] opacity-30",
                )}
                style={
                  isActive || isPast
                    ? {
                        background: color + (isPast ? "55" : ""),
                        color: isActive ? "#000" : color,
                        boxShadow: isActive ? `0 0 12px ${color}80` : undefined,
                      }
                    : {}
                }
              >
                {lvl}
              </div>
              <span
                className={cn(
                  "text-[8px] font-medium transition-opacity",
                  isActive
                    ? "opacity-80"
                    : isPast
                      ? "opacity-40"
                      : "opacity-20",
                )}
                style={{ color: isActive ? color : "rgba(255,255,255,0.5)" }}
              >
                {CEFR_LABEL[lvl]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Animated Stat Card ─────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay = 0,
  loading,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
      className="rounded-2xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm px-4 py-4 flex flex-col gap-2.5 hover:bg-white/[0.07] hover:border-white/[0.12] transition-all duration-300 group"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-white/30 tracking-[0.12em] uppercase">
          {label}
        </span>
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{ background: color + "22" }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} strokeWidth={2} />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-16 rounded-lg bg-white/[0.06] animate-pulse" />
      ) : (
        <div className="flex items-baseline gap-1">
          <span className="text-[30px] font-bold text-white leading-none">
            {value}
          </span>
          {sub && (
            <span className="text-[12px] text-white/35 font-medium">{sub}</span>
          )}
        </div>
      )}
      <div
        className="h-0.5 rounded-full opacity-40"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />
    </motion.div>
  );
}

// ── Skeleton shimmer ───────────────────────────────────────────────────────────

function Skeleton({ className }) {
  return (
    <div
      className={cn("rounded-xl bg-white/[0.05] animate-pulse", className)}
    />
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, rightAction, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
    >
      {(title || rightAction) && (
        <div className="flex items-center justify-between mb-3">
          {title && (
            <h2 className="text-[13px] font-semibold text-white/60 tracking-wide uppercase text-[11px] tracking-[0.12em]">
              {title}
            </h2>
          )}
          {rightAction}
        </div>
      )}
      {children}
    </motion.div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyDashboard({ onStart }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-[#A78BFA]/10 border border-[#A78BFA]/20 flex items-center justify-center mb-6">
        <Mic className="w-8 h-8 text-[#A78BFA] opacity-70" strokeWidth={1.5} />
      </div>
      <h2 className="text-[22px] font-semibold text-white mb-2">
        Start your first session
      </h2>
      <p className="text-[14px] text-white/35 max-w-[300px] leading-relaxed mb-8">
        Have a conversation with Lila and your progress, strengths, and feedback
        will appear here.
      </p>
      <motion.button
        onClick={onStart}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#A78BFA] hover:bg-[#9b77fa] text-white text-[14px] font-semibold shadow-[0_6px_30px_rgba(167,139,250,0.35)] transition-colors"
      >
        <Mic className="w-4 h-4" strokeWidth={2.5} />
        Talk to Lila
      </motion.button>
    </motion.div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "";
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedErr, setExpandedErr] = useState(null);

  useEffect(() => {
    fetchDashboard()
      .then(setStats)
      .catch((e) => console.error("Dashboard fetch failed:", e))
      .finally(() => setLoading(false));
  }, []);

  const time = stats ? formatTime(stats.total_time_seconds) : { h: 0, m: 0 };
  const cefrColor = stats?.latest_cefr
    ? (CEFR_COLOR[stats.latest_cefr] ?? "#A78BFA")
    : "#A78BFA";
  const isEmpty = !loading && (!stats || stats.total_sessions === 0);

  const STAT_CARDS = [
    {
      icon: MessageSquare,
      label: "Sessions",
      value: stats?.total_sessions ?? "—",
      color: "#A78BFA",
      delay: 0.05,
    },
    {
      icon: Clock,
      label: "Practice Time",
      value: `${time.h}h ${time.m}m`,
      color: "#60A5FA",
      delay: 0.1,
    },
    {
      icon: Target,
      label: "Avg Fluency",
      value: stats ? Math.round(stats.average_fluency) : "—",
      sub: "%",
      color: "#34D399",
      delay: 0.15,
    },
    {
      icon: BookOpen,
      label: "Vocab Learned",
      value: stats ? `+${stats.vocabulary_growth}` : "—",
      color: "#F472B6",
      delay: 0.2,
    },
  ];

  return (
    <AppShell activeNav="Dashboard">
      <div className="w-full max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* ── Hero Header ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <p className="text-[13px] text-white/35 font-medium mb-0.5">
              {getGreeting()}
              {firstName ? `, ${firstName}` : ""}
            </p>
            <h1 className="text-[26px] sm:text-[30px] font-bold text-white leading-tight">
              Your Progress
            </h1>
          </div>

          {/* CEFR badge + streak */}
          <div className="flex items-center gap-3">
            {!loading && stats?.streak_days > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <Flame
                  className="w-3.5 h-3.5 text-orange-400"
                  strokeWidth={2}
                />
                <span className="text-[12px] font-semibold text-orange-400">
                  {stats.streak_days} day streak
                </span>
              </div>
            )}
            {!loading && stats?.latest_cefr && stats.latest_cefr !== "N/A" && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border"
                style={{
                  background: cefrColor + "18",
                  borderColor: cefrColor + "40",
                }}
              >
                <Star
                  className="w-3 h-3"
                  style={{ color: cefrColor }}
                  strokeWidth={2}
                />
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: cefrColor }}
                >
                  {stats.latest_cefr} · {CEFR_LABEL[stats.latest_cefr] ?? ""}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Empty state */}
        {isEmpty && <EmptyDashboard onStart={() => navigate("/chat")} />}

        {!isEmpty && (
          <>
            {/* ── Stats Row ───────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {STAT_CARDS.map((card) => (
                <StatCard key={card.label} {...card} loading={loading} />
              ))}
            </div>

            {/* ── Fluency Chart + CEFR Journey ───────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 mb-6">
              {/* Fluency Chart */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="rounded-2xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm px-5 py-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.12em]">
                      Fluency Trend
                    </p>
                    {stats?.fluency_history?.length > 0 && (
                      <p className="text-[22px] font-bold text-white leading-none mt-1">
                        {
                          stats.fluency_history[
                            stats.fluency_history.length - 1
                          ]
                        }
                        <span className="text-[13px] text-white/30 font-medium ml-1">
                          / 100
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {stats?.best_fluency > 0 && (
                      <span className="text-[11px] text-white/30 px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                        Best:{" "}
                        <span className="text-white/60 font-semibold">
                          {stats.best_fluency}
                        </span>
                      </span>
                    )}
                    <TrendingUp
                      className="w-4 h-4 text-[#A78BFA] opacity-60"
                      strokeWidth={2}
                    />
                  </div>
                </div>

                {loading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (stats?.fluency_history?.length ?? 0) < 2 ? (
                  <div className="h-24 flex items-center justify-center text-[12px] text-white/20">
                    Complete more sessions to see your trend
                  </div>
                ) : (
                  <div className="h-24">
                    <FluencyChart data={stats.fluency_history} />
                  </div>
                )}

                {!loading && (stats?.fluency_history?.length ?? 0) >= 2 && (
                  <div className="flex justify-between mt-2">
                    {stats.fluency_history.slice(-7).map((_, i) => {
                      const labels = [
                        "Mon",
                        "Tue",
                        "Wed",
                        "Thu",
                        "Fri",
                        "Sat",
                        "Sun",
                      ];
                      return (
                        <span key={i} className="text-[9px] text-white/20">
                          {labels[i % 7]}
                        </span>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {/* CEFR Journey */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="rounded-2xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm px-5 py-4 flex flex-col justify-between"
              >
                <div className="mb-4">
                  <p className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.12em] mb-1">
                    CEFR Journey
                  </p>
                  <p className="text-[13px] text-white/50 leading-snug">
                    {stats?.latest_cefr && stats.latest_cefr !== "N/A"
                      ? `Currently at ${stats.latest_cefr} · ${CEFR_LABEL[stats.latest_cefr] ?? ""}`
                      : "Start a session to assess your level"}
                  </p>
                </div>
                {loading ? (
                  <Skeleton className="h-14 w-full" />
                ) : (
                  <CEFRJourney currentLevel={stats?.latest_cefr ?? ""} />
                )}
              </motion.div>
            </div>

            {/* ── Main Content Grid ────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
              {/* LEFT COLUMN */}
              <div className="flex flex-col gap-6">
                {/* Strengths + Focus Areas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <Section title="Strengths" delay={0.35}>
                    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm px-4 py-4 flex flex-col gap-2.5">
                      {loading ? (
                        [1, 2, 3].map((k) => (
                          <Skeleton key={k} className="h-4 w-full" />
                        ))
                      ) : !stats?.strengths?.length ? (
                        <p className="text-[12px] text-white/25 text-center py-3">
                          Complete a session to see your strengths
                        </p>
                      ) : (
                        stats.strengths.map((s, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-500/15 flex-shrink-0 flex items-center justify-center">
                              <CheckCircle2
                                className="w-2.5 h-2.5 text-emerald-400"
                                strokeWidth={2.5}
                              />
                            </div>
                            <p className="text-[12px] text-white/65 leading-snug">
                              {s}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </Section>

                  {/* Areas for Improvement */}
                  <Section title="Focus Areas" delay={0.4}>
                    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm px-4 py-4 flex flex-col gap-2.5">
                      {loading ? (
                        [1, 2, 3].map((k) => (
                          <Skeleton key={k} className="h-4 w-full" />
                        ))
                      ) : !stats?.areas_for_improvement?.length ? (
                        <p className="text-[12px] text-white/25 text-center py-3">
                          Nothing to improve yet — keep talking!
                        </p>
                      ) : (
                        stats.areas_for_improvement.map((a, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className="mt-0.5 w-4 h-4 rounded-full bg-amber-500/15 flex-shrink-0 flex items-center justify-center">
                              <AlertTriangle
                                className="w-2.5 h-2.5 text-amber-400"
                                strokeWidth={2.5}
                              />
                            </div>
                            <p className="text-[12px] text-white/65 leading-snug">
                              {a}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </Section>
                </div>

                {/* Grammar Errors */}
                <Section
                  title="Recent Grammar Errors"
                  delay={0.45}
                  rightAction={
                    <span className="text-[10px] text-white/25 uppercase tracking-[0.1em]">
                      From latest sessions
                    </span>
                  }
                >
                  <div className="flex flex-col gap-3">
                    {loading ? (
                      [1, 2].map((k) => (
                        <Skeleton key={k} className="h-24 w-full rounded-2xl" />
                      ))
                    ) : !stats?.recent_grammar_errors?.length ? (
                      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07] px-4 py-8 text-center">
                        <CheckCircle2
                          className="w-7 h-7 text-emerald-400 mx-auto mb-2 opacity-60"
                          strokeWidth={1.5}
                        />
                        <p className="text-[12px] text-white/30">
                          No grammar errors — great work!
                        </p>
                      </div>
                    ) : (
                      stats.recent_grammar_errors.map((err, i) => (
                        <motion.div
                          key={i}
                          layout
                          className="rounded-2xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm overflow-hidden hover:border-white/[0.12] transition-all duration-200"
                        >
                          <button
                            className="w-full px-4 py-3.5 text-left"
                            onClick={() =>
                              setExpandedErr(expandedErr === i ? null : i)
                            }
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className="inline-flex items-center gap-1 text-[9px] font-bold tracking-[0.14em] px-2 py-0.5 rounded-full"
                                style={{
                                  background: "#A78BFA18",
                                  color: "#A78BFA",
                                }}
                              >
                                <Volume2
                                  className="w-2.5 h-2.5"
                                  strokeWidth={2.5}
                                />
                                GRAMMAR
                              </span>
                              <ChevronRight
                                className={cn(
                                  "w-3.5 h-3.5 text-white/25 transition-transform duration-200",
                                  expandedErr === i && "rotate-90",
                                )}
                                strokeWidth={2}
                              />
                            </div>
                            <div className="mt-2 flex items-start gap-2">
                              <span className="shrink-0 mt-0.5 text-red-400/80 text-[11px]">
                                ✗
                              </span>
                              <span className="text-[13px] text-white/30 line-through leading-snug">
                                {err.original}
                              </span>
                            </div>
                            <div className="mt-1.5 flex items-start gap-2">
                              <span className="shrink-0 mt-0.5 text-emerald-400/80 text-[11px]">
                                ✓
                              </span>
                              <span className="text-[13px] text-white/80 leading-snug font-medium">
                                {err.corrected}
                              </span>
                            </div>
                          </button>
                          <AnimatePresence>
                            {expandedErr === i && err.explanation && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="px-4 pb-3.5 overflow-hidden"
                              >
                                <div className="pt-2 border-t border-white/[0.07]">
                                  <p className="text-[11px] text-white/40 leading-relaxed">
                                    {err.explanation}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))
                    )}
                  </div>
                </Section>

                {/* Topics */}
                {!loading && stats?.topics_frequency?.length > 0 && (
                  <Section title="Topics You've Discussed" delay={0.5}>
                    <div className="flex flex-wrap gap-2">
                      {stats.topics_frequency.map(({ topic }) => (
                        <div
                          key={topic}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.14] transition-all duration-200"
                        >
                          <Hash
                            className="w-3 h-3 text-white/30"
                            strokeWidth={2}
                          />
                          <span className="text-[12px] text-white/60">
                            {topic}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}
              </div>

              {/* RIGHT COLUMN */}
              <div className="flex flex-col gap-6">
                {/* Vocabulary Highlights */}
                <Section title="Vocabulary" delay={0.45}>
                  <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm px-4 py-4">
                    {loading ? (
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5].map((k) => (
                          <Skeleton key={k} className="h-7 w-20 rounded-xl" />
                        ))}
                      </div>
                    ) : !stats?.vocabulary_highlights?.length ? (
                      <p className="text-[12px] text-white/25 py-2 text-center">
                        No vocab words yet
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {stats.vocabulary_highlights.map((word, i) => (
                          <motion.span
                            key={word}
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.04 }}
                            className="px-3 py-1.5 rounded-xl text-[12px] font-medium border transition-all hover:scale-105"
                            style={{
                              background: "#A78BFA14",
                              borderColor: "#A78BFA35",
                              color: "#C4B5FD",
                            }}
                          >
                            {word}
                          </motion.span>
                        ))}
                      </div>
                    )}
                  </div>
                </Section>

                {/* Recent Sessions */}
                <Section
                  title="Recent Sessions"
                  delay={0.5}
                  rightAction={
                    <button
                      onClick={() => navigate("/history")}
                      className="flex items-center gap-1 text-[11px] text-[#A78BFA] hover:text-white transition-colors"
                    >
                      View All
                      <ChevronRight className="w-3 h-3" strokeWidth={2} />
                    </button>
                  }
                >
                  <div className="flex flex-col gap-2.5">
                    {loading ? (
                      [1, 2, 3].map((k) => (
                        <Skeleton key={k} className="h-20 w-full rounded-2xl" />
                      ))
                    ) : !stats?.recent_sessions?.length ? (
                      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07] px-4 py-6 text-center">
                        <p className="text-[12px] text-white/25">
                          No sessions yet
                        </p>
                      </div>
                    ) : (
                      stats.recent_sessions.slice(0, 3).map((s, i) => {
                        const color = fluencyColor(s.fluency_score ?? 0);
                        const cefrCol = CEFR_COLOR[s.cefr_level] ?? "#A78BFA";
                        return (
                          <motion.div
                            key={s.session_id ?? i}
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + i * 0.06 }}
                            onClick={() =>
                              navigate("/history", {
                                state: { openSession: s },
                              })
                            }
                            className="rounded-2xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm px-4 py-3.5 hover:bg-white/[0.07] hover:border-[#A78BFA]/30 transition-all duration-200 cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="text-[13px] font-semibold text-white/85 truncate">
                                {s.session_title || "Untitled Session"}
                              </span>
                              <span className="text-[10px] text-white/25 flex-shrink-0">
                                {timeAgo(s.analysed_at)}
                              </span>
                            </div>

                            {s.session_summary && (
                              <p className="text-[11px] text-white/35 leading-snug line-clamp-2 mb-2">
                                {s.session_summary}
                              </p>
                            )}

                            {/* Fluency bar */}
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex-1 h-1 rounded-full bg-white/[0.08]">
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ background: color }}
                                  initial={{ width: 0 }}
                                  animate={{
                                    width: `${s.fluency_score ?? 0}%`,
                                  }}
                                  transition={{
                                    duration: 0.7,
                                    delay: 0.6 + i * 0.06,
                                  }}
                                />
                              </div>
                              <span
                                className="text-[11px] font-bold flex-shrink-0"
                                style={{ color }}
                              >
                                {s.fluency_score ?? 0}
                              </span>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1">
                              {s.cefr_level && (
                                <span
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                  style={{
                                    background: cefrCol + "22",
                                    color: cefrCol,
                                  }}
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
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </Section>

                {/* Start New Session CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                >
                  <motion.button
                    onClick={() => navigate("/chat")}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 8px 40px rgba(167,139,250,0.45)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-[#A78BFA] hover:bg-[#9b77fa] text-white text-[14px] font-bold transition-colors shadow-[0_6px_30px_rgba(167,139,250,0.3)]"
                  >
                    <Mic className="w-4 h-4" strokeWidth={2.5} />
                    Start New Session
                    <Zap className="w-3.5 h-3.5 opacity-70" strokeWidth={2.5} />
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
