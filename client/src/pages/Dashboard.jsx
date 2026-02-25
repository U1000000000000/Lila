import React, { useState } from "react";
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

const STATS = [
  { icon: LayoutDashboard, label: "SESSIONS", value: "12", color: "#A78BFA" },
  { icon: Clock, label: "TIME", value: "4 20", sub: "h  m", color: "#60A5FA" },
  { icon: Target, label: "ACCURACY", value: "88", sub: "%", color: "#34D399" },
  { icon: BookOpen, label: "VOCAB", value: "+45", color: "#F472B6" },
];

const AREAS = [
  {
    tag: "GRAMMAR",
    tagColor: "#A78BFA",
    date: "Yesterday, 6:32 PM",
    lines: [
      { icon: "error", text: "I go to store yesterday." },
      { icon: "ok", text: "I went to the store yesterday." },
    ],
    action: "Listen",
    actionIcon: Volume2,
  },
  {
    tag: "PRONUNCIATION",
    tagColor: "#FBBF24",
    date: "Today, 10:15 AM",
    lines: [{ icon: "warn", text: "Comfortable" }],
    sub: "/ˈkʌmf.tə.bəl/ → /kʌmf.tər.bəl/",
    action: "Practice",
    actionIcon: Mic,
  },
];

const CHART_DATA = [18, 28, 22, 40, 35, 55, 60, 50, 70, 65, 80, 72, 85, 88];

const SESSIONS = [
  {
    title: "Business Negotiation",
    desc: "Focus on formal greetings and conditional phrases.",
    tags: ["B2+", "Advanced"],
    time: "2d ago",
    color: "#A78BFA",
  },
  {
    title: "Casual Coffee Chat",
    desc: "Small talk about weekend and everyday city.",
    tags: ["B1e", "Intermediate"],
    time: "Yesterday",
    color: "#60A5FA",
  },
  {
    title: "Travel Vocabulary",
    desc: "Airport and travel check-in scenarios.",
    tags: ["B1e", "Beginner"],
    time: "0d:22:14",
    color: "#34D399",
  },
];

function FluentyChart() {
  const w = 140;
  const h = 60;
  const max = Math.max(...CHART_DATA);
  const pts = CHART_DATA.map((v, i) => {
    const x = (i / (CHART_DATA.length - 1)) * w;
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
        const last = CHART_DATA.length - 1;
        const x = w;
        const y = h - (CHART_DATA[last] / max) * h * 0.85 - 4;
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
            {STATS.map(({ icon: Icon, label, value, sub, color }) => (
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
                    {value}
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
              <FluentyChart />
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
          {/* Areas to Improve */}
          <motion.div {...fadeUp(0.15)}>
            <h2 className="text-[14px] font-semibold text-white/80 mb-3">
              Areas to Improve
            </h2>
            <div className="flex flex-col gap-3">
              {AREAS.map((area, i) => (
                <div
                  key={i}
                  className="rounded-[14px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm px-4 py-3 hover:bg-white/[0.07] transition-colors duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[9px] font-bold tracking-[0.12em] px-2 py-0.5 rounded-full"
                        style={{
                          background: area.tagColor + "22",
                          color: area.tagColor,
                        }}
                      >
                        {area.tag}
                      </span>
                      <span className="text-[10px] text-white/25">
                        {area.date}
                      </span>
                    </div>
                    <button className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 transition-colors">
                      <area.actionIcon className="w-3 h-3" strokeWidth={2} />
                      {area.action}
                    </button>
                  </div>
                  {area.lines.map((line, j) => (
                    <div key={j} className="flex items-start gap-2 mb-1">
                      {line.icon === "error" && (
                        <span className="mt-0.5 text-red-400 text-[11px]">
                          ✗
                        </span>
                      )}
                      {line.icon === "ok" && (
                        <span className="mt-0.5 text-green-400 text-[11px]">
                          ✓
                        </span>
                      )}
                      {line.icon === "warn" && (
                        <AlertTriangle
                          className="mt-0.5 w-3 h-3 text-yellow-400 flex-shrink-0"
                          strokeWidth={2}
                        />
                      )}
                      <span
                        className={cn(
                          "text-[13px] leading-snug",
                          line.icon === "error"
                            ? "text-white/35 line-through"
                            : "text-white/75",
                        )}
                      >
                        {line.text}
                      </span>
                    </div>
                  ))}
                  {area.sub && (
                    <p className="text-[10px] text-white/25 mt-1 font-mono">
                      {area.sub}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Sessions */}
          <motion.div {...fadeUp(0.2)}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[14px] font-semibold text-white/80">
                Recent Sessions
              </h2>
              <button className="text-[11px] text-[#A78BFA] hover:text-white transition-colors">
                View All
              </button>
            </div>
            <div className="flex flex-col gap-2 mb-4">
              {SESSIONS.map((s, i) => (
                <div
                  key={i}
                  className="rounded-[12px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm px-3 py-2.5 hover:bg-white/[0.07] transition-colors duration-200 cursor-pointer"
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="mt-0.5 w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background: s.color,
                        boxShadow: `0 0 6px ${s.color}60`,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[12px] font-medium text-white/85 truncate">
                          {s.title}
                        </span>
                        <span className="text-[10px] text-white/25 flex-shrink-0">
                          {s.time}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/35 mt-0.5 leading-snug line-clamp-2">
                        {s.desc}
                      </p>
                      <div className="flex gap-1 mt-1.5">
                        {s.tags.map((t) => (
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
              ))}
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
