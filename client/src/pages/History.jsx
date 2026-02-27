import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, Clock, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import AppShell from "../components/layout/AppShell";
import { cn } from "../utils/cn";
import { fetchHistory } from "../services/api";

const TAG_STYLES = {
  Active:   { bg: "rgba(167,139,250,0.15)", text: "#A78BFA" },
  Business: { bg: "rgba(96,165,250,0.15)",  text: "#60A5FA" },
  Social:   { bg: "rgba(52,211,153,0.15)",  text: "#34D399" },
  Travel:   { bg: "rgba(251,146,60,0.15)",  text: "#FB923C" },
  Basics:   { bg: "rgba(250,204,21,0.15)",  text: "#FACC15" },
};

const CEFR_STYLE = {
  A1: { bg: "rgba(248,113,113,0.15)", text: "#F87171" },
  A2: { bg: "rgba(251,146,60,0.15)",  text: "#FB923C" },
  B1: { bg: "rgba(250,204,21,0.15)",  text: "#FACC15" },
  B2: { bg: "rgba(52,211,153,0.15)",  text: "#34D399" },
  C1: { bg: "rgba(96,165,250,0.15)",  text: "#60A5FA" },
  C2: { bg: "rgba(167,139,250,0.15)", text: "#A78BFA" },
};

function fluencyColor(score) {
  if (score >= 85) return "#34D399";
  if (score >= 70) return "#FACC15";
  return "#F87171";
}

function formatMonthGroup(isoDate) {
  if (!isoDate) return "UNKNOWN";
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();
}

function formatDuration(seconds) {
  if (!seconds) return "0m 0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

/** Group a flat list of analyses by month label */
function groupByMonth(items) {
  const groups = {};
  for (const item of items) {
    const key = formatMonthGroup(item.analysed_at);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return Object.entries(groups).map(([month, sessions]) => ({ month, sessions }));
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut", delay },
});

export default function History() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchHistory(1, PAGE_SIZE)
      .then((data) => {
        setAllItems(data.items ?? []);
        setHasMore((data.items ?? []).length === PAGE_SIZE);
        setPage(1);
      })
      .catch((e) => console.error("History fetch failed:", e))
      .finally(() => setLoading(false));
  }, []);

  const loadMore = () => {
    const next = page + 1;
    fetchHistory(next, PAGE_SIZE)
      .then((data) => {
        setAllItems((prev) => [...prev, ...(data.items ?? [])]);
        setHasMore((data.items ?? []).length === PAGE_SIZE);
        setPage(next);
      })
      .catch((e) => console.error("Load more failed:", e));
  };

  // Filter by search, then group by month
  const filtered = allItems.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.session_title ?? "").toLowerCase().includes(q) ||
      (s.cefr_level ?? "").toLowerCase().includes(q) ||
      (s.topics ?? []).some((t) => t.toLowerCase().includes(q))
    );
  });

  const grouped = groupByMonth(filtered);

  return (
    <AppShell activeNav="History">
      <div className="max-w-[780px] w-full mx-auto px-6 py-10">
        {/* Header row */}
        <motion.div
          {...fadeUp(0)}
          className="flex items-start justify-between mb-8 gap-6 flex-wrap"
        >
          <div>
            <h1 className="text-[28px] font-semibold text-white mb-1">
              Session History
            </h1>
            <p className="text-[13px] text-white/35 max-w-[340px] leading-relaxed">
              Review your past conversations, track your fluency progress, and
              revisit key learning moments.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25"
                strokeWidth={2}
              />
              <input
                type="text"
                placeholder="Search sessions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[200px] pl-8 pr-4 py-2 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-[12px] text-white/70 placeholder-white/25 focus:outline-none focus:border-white/[0.2] transition-colors"
              />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-[12px] text-white/50 hover:text-white/80 hover:border-white/[0.15] transition-all">
              <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={2} />
              Filter
            </button>
          </div>
        </motion.div>

        {/* Session groups */}
        {loading ? (
          <p className="text-[13px] text-white/25 text-center mt-16">Loading sessions…</p>
        ) : grouped.length === 0 ? (
          <p className="text-[13px] text-white/25 text-center mt-16">
            No sessions found.
          </p>
        ) : (
          grouped.map((group, gi) => (
            <motion.div
              key={group.month}
              {...fadeUp(gi * 0.08)}
              className="mb-8"
            >
              <p className="text-[11px] font-semibold text-white/25 tracking-[0.15em] uppercase mb-3">
                {group.month}
              </p>
              <div className="flex flex-col gap-3">
                {group.sessions.map((s, si) => {
                  const cefrStyle = CEFR_STYLE[s.cefr_level] ?? CEFR_STYLE.B1;
                  const color = fluencyColor(s.fluency_score ?? 0);
                  const date = s.analysed_at ? new Date(s.analysed_at) : null;
                  const dayNum = date ? date.getDate().toString().padStart(2, "0") : "--";
                  const monStr = date
                    ? date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
                    : "---";
                  const timeStr = date
                    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "";
                  return (
                    <motion.div
                      key={s.session_id ?? si}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: gi * 0.08 + si * 0.05,
                        duration: 0.3,
                      }}
                      className="flex items-center gap-5 rounded-[14px] bg-white/[0.03] border border-white/[0.07] backdrop-blur-sm px-5 py-4 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
                    >
                      {/* Date */}
                      <div className="flex-shrink-0 flex flex-col items-center justify-center w-11 h-11 rounded-[10px] bg-white/[0.05] border border-white/[0.08]">
                        <span className="text-[9px] text-white/35 font-semibold tracking-wider uppercase leading-none">
                          {monStr}
                        </span>
                        <span className="text-[20px] font-bold text-white leading-tight">
                          {dayNum}
                        </span>
                      </div>

                      {/* Title + meta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[15px] font-semibold text-white/90">
                            {s.session_title || "Untitled Session"}
                          </span>
                          {s.cefr_level && (
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: cefrStyle.bg, color: cefrStyle.text }}
                            >
                              {s.cefr_level}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-[11px] text-white/30">
                            <Clock className="w-3 h-3" strokeWidth={2} />
                            {timeStr}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-white/30">
                            <Clock className="w-3 h-3" strokeWidth={2} />
                            {formatDuration(s.duration_seconds)}
                          </span>
                          {(s.topics ?? []).slice(0, 2).map((t) => (
                            <span key={t} className="text-[10px] text-white/25">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Fluency */}
                      <div className="flex-shrink-0 flex flex-col items-end gap-1.5 w-[110px]">
                        <span className="text-[9px] text-white/25 tracking-[0.1em] uppercase font-semibold">
                          Fluency
                        </span>
                        <div className="flex items-center gap-2 w-full justify-end">
                          <div className="flex-1 h-1 rounded-full bg-white/[0.08] overflow-hidden max-w-[60px]">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${s.fluency_score ?? 0}%`,
                                background: color,
                              }}
                            />
                          </div>
                          <span className="text-[18px] font-bold text-white leading-none">
                            {s.fluency_score ?? 0}
                          </span>
                        </div>
                      </div>

                      {/* CTA */}
                      <button className="flex-shrink-0 px-4 py-2 rounded-[10px] bg-white/[0.05] border border-white/[0.08] text-[12px] text-white/50 hover:text-white hover:bg-white/[0.1] hover:border-white/[0.2] transition-all duration-200 whitespace-nowrap">
                        View Details
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))
        )}

        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center mt-4 mb-8">
            <button
              onClick={loadMore}
              className="flex items-center gap-2 text-[12px] text-white/35 hover:text-white/60 transition-colors"
            >
              Load more sessions
              <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
