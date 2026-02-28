import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Clock,
  ChevronDown,
  X,
  MessageCircle,
  User,
  Mic,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Hash,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AppShell from "../components/layout/AppShell";
import { cn } from "../utils/cn";
import {
  fetchHistory,
  fetchConversation,
  fetchSessionAnalysis,
} from "../services/api";

// ── Constants ──────────────────────────────────────────────────────────────────

const CEFR_STYLE = {
  A1: { bg: "rgba(248,113,113,0.15)", text: "#F87171" },
  A2: { bg: "rgba(251,146,60,0.15)", text: "#FB923C" },
  B1: { bg: "rgba(250,204,21,0.15)", text: "#FACC15" },
  B2: { bg: "rgba(52,211,153,0.15)", text: "#34D399" },
  C1: { bg: "rgba(96,165,250,0.15)", text: "#60A5FA" },
  C2: { bg: "rgba(167,139,250,0.15)", text: "#A78BFA" },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function fluencyColor(score) {
  if (score >= 75) return "#34D399";
  if (score >= 50) return "#FACC15";
  if (score >= 30) return "#FB923C";
  return "#F87171";
}

function formatMonthGroup(isoDate) {
  if (!isoDate) return "UNKNOWN";
  const d = new Date(isoDate);
  return d
    .toLocaleDateString("en-US", { month: "long", year: "numeric" })
    .toUpperCase();
}

function formatDuration(seconds) {
  if (!seconds) return "< 1m";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDateTime(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByMonth(items) {
  const groups = {};
  for (const item of items) {
    const key = formatMonthGroup(item.analysed_at);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return Object.entries(groups).map(([month, sessions]) => ({
    month,
    sessions,
  }));
}

// ── Chat Bubble ────────────────────────────────────────────────────────────────

function ChatBubble({ role, content, index }) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.025, 0.5) }}
      className={cn(
        "flex gap-2 mb-2.5",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5",
          isUser
            ? "bg-[#A78BFA]/20 text-[#A78BFA]"
            : "bg-white/[0.07] text-white/50",
        )}
      >
        {isUser ? (
          <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" strokeWidth={2.5} />
        ) : (
          "L"
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-[12px] sm:text-[13px] leading-relaxed",
          isUser
            ? "bg-[#A78BFA]/20 text-white/90 rounded-tr-sm"
            : "bg-white/[0.06] text-white/70 rounded-tl-sm border border-white/[0.06]",
        )}
      >
        {content}
      </div>
    </motion.div>
  );
}

// ── Chat Modal ─────────────────────────────────────────────────────────────────

function ChatModal({ session, onClose }) {
  const [messages, setMessages] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("chat");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!session?.session_id) return;
    Promise.all([
      fetchConversation(session.session_id).catch(() => ({ messages: [] })),
      fetchSessionAnalysis(session.session_id).catch(() => null),
    ]).then(([convData, analysisData]) => {
      setMessages(convData?.messages ?? []);
      setAnalysis(analysisData);
      setLoading(false);
    });
  }, [session?.session_id]);

  useEffect(() => {
    if (tab === "chat" && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, tab]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const cefrStyle = CEFR_STYLE[session?.cefr_level] ?? CEFR_STYLE.B1;
  const fColor = fluencyColor(session?.fluency_score ?? 0);

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center sm:px-4 sm:pb-4 sm:pt-28 pt-16 sm:pt-28"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "w-full flex flex-col bg-[#0d0d0d] border-white/[0.08] overflow-hidden shadow-2xl",
            // Mobile: slides up from bottom, full width, rounded top corners only
            "rounded-t-2xl border-t border-x max-h-[75vh]",
            // Tablet+: centered card with all rounded corners
            "sm:rounded-2xl sm:border sm:max-w-xl sm:max-h-[70vh]",
          )}
        >
          {/* Drag handle — mobile only */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/15" />
          </div>

          {/* Header */}
          <div className="flex-shrink-0 px-4 sm:px-5 py-3 sm:py-4 border-b border-white/[0.07] flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-[15px] sm:text-[16px] font-semibold text-white truncate">
                  {session?.session_title || "Untitled Session"}
                </h2>
                {session?.cefr_level && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: cefrStyle.bg, color: cefrStyle.text }}
                  >
                    {session.cefr_level}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="flex items-center gap-1 text-[10px] sm:text-[11px] text-white/30">
                  <Clock className="w-3 h-3" strokeWidth={2} />
                  {formatDateTime(session?.analysed_at)}
                </span>
                <span className="flex items-center gap-1 text-[10px] sm:text-[11px] text-white/30">
                  <Mic className="w-3 h-3" strokeWidth={2} />
                  {formatDuration(session?.duration_seconds)}
                </span>
                {session?.fluency_score > 0 && (
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: fColor }}
                  >
                    {session.fluency_score} fluency
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] flex items-center justify-center text-white/40 hover:text-white transition-all duration-200"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex-shrink-0 flex items-center gap-1 px-4 sm:px-5 pt-2.5 pb-0">
            {[
              { id: "chat", label: "Conversation", icon: MessageCircle },
              { id: "analysis", label: "Analysis", icon: CheckCircle2 },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] sm:text-[12px] font-medium transition-all duration-200 mb-2",
                  tab === id
                    ? "bg-white/[0.08] text-white"
                    : "text-white/35 hover:text-white/60",
                )}
              >
                <Icon className="w-3 h-3" strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 sm:py-4"
            style={{ scrollbarWidth: "none" }}
          >
            {loading ? (
              <div className="flex flex-col gap-3 py-4">
                {[1, 2, 3, 4].map((k) => (
                  <div
                    key={k}
                    className={cn(
                      "h-9 rounded-2xl bg-white/[0.05] animate-pulse",
                      k % 2 === 0 ? "mr-14" : "ml-14",
                    )}
                  />
                ))}
              </div>
            ) : tab === "chat" ? (
              messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <MessageCircle
                    className="w-10 h-10 text-white/15 mb-3"
                    strokeWidth={1.5}
                  />
                  <p className="text-[13px] text-white/25">
                    No conversation found
                  </p>
                </div>
              ) : (
                <div className="py-1">
                  {messages.map((msg, i) => (
                    <ChatBubble
                      key={i}
                      role={msg.role}
                      content={msg.content}
                      index={i}
                    />
                  ))}
                </div>
              )
            ) : (
              /* Analysis tab */
              <div className="flex flex-col gap-5 py-1">
                {!analysis || analysis.status !== "done" ? (
                  <div className="text-center py-10 text-[13px] text-white/25">
                    No analysis available
                  </div>
                ) : (
                  <>
                    {analysis.session_summary && (
                      <div>
                        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.12em] mb-2">
                          Summary
                        </p>
                        <p className="text-[12px] sm:text-[13px] text-white/60 leading-relaxed bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-3">
                          {analysis.session_summary}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {analysis.strengths?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.12em] mb-2">
                            Strengths
                          </p>
                          <div className="flex flex-col gap-2">
                            {analysis.strengths.map((s, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <CheckCircle2
                                  className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5"
                                  strokeWidth={2.5}
                                />
                                <p className="text-[12px] text-white/60 leading-snug">
                                  {s}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {analysis.areas_for_improvement?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.12em] mb-2">
                            Focus Areas
                          </p>
                          <div className="flex flex-col gap-2">
                            {analysis.areas_for_improvement.map((a, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <AlertTriangle
                                  className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5"
                                  strokeWidth={2.5}
                                />
                                <p className="text-[12px] text-white/60 leading-snug">
                                  {a}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {analysis.grammar_errors?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.12em] mb-2">
                          Grammar Corrections
                        </p>
                        <div className="flex flex-col gap-2.5">
                          {analysis.grammar_errors.map((err, i) => (
                            <div
                              key={i}
                              className="rounded-xl bg-white/[0.04] border border-white/[0.07] px-4 py-3"
                            >
                              <div className="flex items-start gap-2 mb-1">
                                <span className="text-red-400/70 text-[11px] shrink-0 mt-0.5">
                                  ✗
                                </span>
                                <span className="text-[12px] text-white/30 line-through leading-snug">
                                  {err.original}
                                </span>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="text-emerald-400/70 text-[11px] shrink-0 mt-0.5">
                                  ✓
                                </span>
                                <span className="text-[12px] text-white/75 leading-snug font-medium">
                                  {err.corrected}
                                </span>
                              </div>
                              {err.explanation && (
                                <p className="text-[11px] text-white/35 mt-2 pl-4 leading-relaxed">
                                  {err.explanation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.vocabulary_highlights?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.12em] mb-2">
                          <BookOpen
                            className="inline w-3 h-3 mr-1 opacity-60"
                            strokeWidth={2}
                          />
                          Vocabulary
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.vocabulary_highlights.map((w) => (
                            <span
                              key={w}
                              className="px-2.5 py-1 rounded-xl text-[11px] sm:text-[12px] font-medium border"
                              style={{
                                background: "#A78BFA14",
                                borderColor: "#A78BFA35",
                                color: "#C4B5FD",
                              }}
                            >
                              {w}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.topics?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.12em] mb-2">
                          Topics
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.topics.map((t) => (
                            <span
                              key={t}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.07] text-[11px] text-white/50"
                            >
                              <Hash
                                className="w-2.5 h-2.5 text-white/25"
                                strokeWidth={2}
                              />
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main History Page ──────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut", delay },
});

export default function History() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedSession, setSelectedSession] = useState(
    location.state?.openSession ?? null,
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const PAGE_SIZE = 20;

  useEffect(() => {
    fetchHistory(1, PAGE_SIZE)
      .then((data) => {
        setAllItems(data.items ?? []);
        setHasMore((data.items ?? []).length === PAGE_SIZE);
        setPage(1);
      })
      .catch((e) => {
        console.error("History fetch failed:", e);
        setAllItems([]);
      })
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
      {selectedSession && (
        <ChatModal
          key={selectedSession.session_id}
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}

      <div className="max-w-[820px] w-full mx-auto px-3 sm:px-6 pb-16 pt-2">
        {/* ── Page Header ──────────────────────────────────────────── */}
        <motion.div
          {...fadeUp(0)}
          className="flex items-start justify-between gap-3 mb-6 sm:mb-8"
        >
          <div>
            <h1 className="text-[22px] sm:text-[28px] font-bold text-white mb-0.5 sm:mb-1">
              Session History
            </h1>
            <p className="text-[12px] sm:text-[13px] text-white/35 leading-relaxed hidden sm:block">
              Review past conversations and revisit key learning moments.
            </p>
          </div>

          {/* Search — icon button on mobile, expanded on sm+ */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Mobile: just an icon that toggles input */}
            <button
              className="sm:hidden w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/40 hover:text-white transition-colors"
              onClick={() => setSearchOpen((v) => !v)}
            >
              <Search className="w-3.5 h-3.5" strokeWidth={2} />
            </button>

            {/* Desktop: always-visible input */}
            <div className="hidden sm:block relative">
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
          </div>
        </motion.div>

        {/* Mobile search input (expanded) */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-4 sm:hidden"
            >
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
                  autoFocus
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[13px] text-white/70 placeholder-white/25 focus:outline-none focus:border-white/[0.2] transition-colors"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Session Groups ────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((k) => (
              <div
                key={k}
                className="h-20 sm:h-24 rounded-2xl bg-white/[0.04] animate-pulse"
              />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center py-16 sm:py-20 text-center">
            <MessageCircle
              className="w-10 h-10 text-white/15 mb-3"
              strokeWidth={1.5}
            />
            <p className="text-[14px] text-white/30 mb-2">No sessions found</p>
            <button
              onClick={() => navigate("/chat")}
              className="mt-4 px-6 py-2.5 rounded-xl bg-[#A78BFA] text-white text-[13px] font-semibold hover:bg-[#9b77fa] transition-colors"
            >
              Start a Session
            </button>
          </div>
        ) : (
          grouped.map((group, gi) => (
            <motion.div
              key={group.month}
              {...fadeUp(gi * 0.06)}
              className="mb-6 sm:mb-8"
            >
              <p className="text-[10px] sm:text-[11px] font-semibold text-white/25 tracking-[0.15em] uppercase mb-2.5 sm:mb-3 pl-1">
                {group.month}
              </p>
              <div className="flex flex-col gap-2 sm:gap-3">
                {group.sessions.map((s, si) => {
                  const cefrStyle = CEFR_STYLE[s.cefr_level] ?? CEFR_STYLE.B1;
                  const fColor = fluencyColor(s.fluency_score ?? 0);
                  const date = s.analysed_at ? new Date(s.analysed_at) : null;
                  const dayNum = date
                    ? date.getDate().toString().padStart(2, "0")
                    : "--";
                  const monStr = date
                    ? date
                        .toLocaleDateString("en-US", { month: "short" })
                        .toUpperCase()
                    : "---";
                  const timeStr = date
                    ? date.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "";

                  return (
                    <motion.div
                      key={s.session_id ?? si}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: gi * 0.06 + si * 0.035,
                        duration: 0.28,
                      }}
                      className="flex items-center gap-3 sm:gap-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] px-3 sm:px-4 py-3 sm:py-4 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200 group"
                    >
                      {/* Date badge */}
                      <div className="flex-shrink-0 flex flex-col items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-[10px] bg-white/[0.05] border border-white/[0.08]">
                        <span className="text-[8px] sm:text-[9px] text-white/35 font-semibold tracking-wider uppercase leading-none">
                          {monStr}
                        </span>
                        <span className="text-[18px] sm:text-[20px] font-bold text-white leading-tight">
                          {dayNum}
                        </span>
                      </div>

                      {/* Title + meta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-0.5 sm:mb-1">
                          <span className="text-[13px] sm:text-[14px] font-semibold text-white/90 truncate max-w-[55vw] sm:max-w-none">
                            {s.session_title || "Untitled Session"}
                          </span>
                          {s.cefr_level && (
                            <span
                              className="text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{
                                background: cefrStyle.bg,
                                color: cefrStyle.text,
                              }}
                            >
                              {s.cefr_level}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                          <span className="flex items-center gap-1 text-[10px] sm:text-[11px] text-white/30">
                            <Clock
                              className="w-2.5 h-2.5 sm:w-3 sm:h-3"
                              strokeWidth={2}
                            />
                            {timeStr}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] sm:text-[11px] text-white/30">
                            <Mic
                              className="w-2.5 h-2.5 sm:w-3 sm:h-3"
                              strokeWidth={2}
                            />
                            {formatDuration(s.duration_seconds)}
                          </span>
                          {/* Topics — hidden on very small screens */}
                          <span className="hidden xs:inline text-[10px] text-white/25 truncate">
                            {(s.topics ?? [])
                              .slice(0, 2)
                              .map((t) => `#${t}`)
                              .join(" ")}
                          </span>
                        </div>
                      </div>

                      {/* Fluency — hidden on mobile */}
                      <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0 w-[80px]">
                        <span className="text-[9px] text-white/25 tracking-[0.1em] uppercase font-semibold">
                          Fluency
                        </span>
                        <div className="flex items-center gap-1.5 w-full justify-end">
                          <div className="flex-1 h-1 rounded-full bg-white/[0.08] overflow-hidden max-w-[44px]">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${s.fluency_score ?? 0}%`,
                                background: fColor,
                              }}
                            />
                          </div>
                          <span className="text-[15px] font-bold text-white leading-none">
                            {s.fluency_score ?? 0}
                          </span>
                        </div>
                      </div>

                      {/* View button */}
                      <button
                        onClick={() => setSelectedSession(s)}
                        className="flex-shrink-0 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-[11px] sm:text-[12px] text-white/50 hover:text-white hover:bg-[#A78BFA]/20 hover:border-[#A78BFA]/40 transition-all duration-200 whitespace-nowrap flex items-center gap-1 sm:gap-1.5"
                      >
                        <MessageCircle
                          className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                          strokeWidth={2}
                        />
                        <span className="hidden xs:inline">View</span>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <div className="flex justify-center mt-2 mb-8">
            <button
              onClick={loadMore}
              className="flex items-center gap-2 text-[12px] text-white/35 hover:text-white/60 px-4 py-2 rounded-xl hover:bg-white/[0.04] transition-all"
            >
              Load more
              <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
