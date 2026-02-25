import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, Clock, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import AppShell from "../components/layout/AppShell";
import { cn } from "../utils/cn";

const TAG_STYLES = {
  Active: { bg: "rgba(167,139,250,0.15)", text: "#A78BFA" },
  Business: { bg: "rgba(96,165,250,0.15)", text: "#60A5FA" },
  Social: { bg: "rgba(52,211,153,0.15)", text: "#34D399" },
  Travel: { bg: "rgba(251,146,60,0.15)", text: "#FB923C" },
  Basics: { bg: "rgba(250,204,21,0.15)", text: "#FACC15" },
};

function fluencyColor(score) {
  if (score >= 85) return "#34D399";
  if (score >= 70) return "#FACC15";
  return "#F87171";
}

const HISTORY_DATA = [
  {
    month: "OCTOBER 2023",
    sessions: [
      {
        day: "24",
        mon: "OCT",
        title: "Coffee Shop Roleplay",
        tag: "Active",
        time: "14:20 PM",
        dur: "12m 30s",
        score: 92,
      },
      {
        day: "22",
        mon: "OCT",
        title: "Business Negotiation: Salary",
        tag: "Business",
        time: "09:15 AM",
        dur: "25m 10s",
        score: 78,
      },
      {
        day: "19",
        mon: "OCT",
        title: "Casual Chat: Weekend Plans",
        tag: "Social",
        time: "18:45 PM",
        dur: "08m 45s",
        score: 85,
      },
    ],
  },
  {
    month: "SEPTEMBER 2023",
    sessions: [
      {
        day: "28",
        mon: "SEP",
        title: "Travel: Checking In",
        tag: "Travel",
        time: "11:00 AM",
        dur: "15m 00s",
        score: 64,
      },
      {
        day: "25",
        mon: "SEP",
        title: "Introduction to Colors",
        tag: "Basics",
        time: "16:30 PM",
        dur: "05m 20s",
        score: 72,
      },
    ],
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut", delay },
});

export default function History() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = HISTORY_DATA.map((g) => ({
    ...g,
    sessions: g.sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.tag.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter((g) => g.sessions.length > 0);

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
        {filtered.length === 0 ? (
          <p className="text-[13px] text-white/25 text-center mt-16">
            No sessions found.
          </p>
        ) : (
          filtered.map((group, gi) => (
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
                  const tag = TAG_STYLES[s.tag] ?? TAG_STYLES.Basics;
                  const color = fluencyColor(s.score);
                  return (
                    <motion.div
                      key={si}
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
                          {s.mon}
                        </span>
                        <span className="text-[20px] font-bold text-white leading-tight">
                          {s.day}
                        </span>
                      </div>

                      {/* Title + meta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[15px] font-semibold text-white/90">
                            {s.title}
                          </span>
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: tag.bg, color: tag.text }}
                          >
                            {s.tag}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[11px] text-white/30">
                            <Clock className="w-3 h-3" strokeWidth={2} />
                            {s.time}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-white/30">
                            <Clock className="w-3 h-3" strokeWidth={2} />
                            {s.dur}
                          </span>
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
                                width: `${s.score}%`,
                                background: color,
                              }}
                            />
                          </div>
                          <span className="text-[18px] font-bold text-white leading-none">
                            {s.score}
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
        <div className="flex justify-center mt-4 mb-8">
          <button className="flex items-center gap-2 text-[12px] text-white/35 hover:text-white/60 transition-colors">
            Load more sessions
            <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
