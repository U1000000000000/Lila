import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";

export default function TranscriptOverlay({
  messages = [],
  isSessionStarted,
  status,
  blobState,
  isAiThinking = false,
}) {
  const scrollRef = useRef(null);
  const isConnected = isSessionStarted && !status.includes("🔴");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAiThinking]);

  const dotColor = cn(
    "w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-500",
    blobState === "idle" && "bg-white/30",
    blobState === "listening" &&
      "bg-[#A78BFA] shadow-[0_0_6px_rgba(167,139,250,0.5)]",
    blobState === "computing" &&
      "bg-[#C4B5FD] shadow-[0_0_6px_rgba(196,181,253,0.5)]",
    blobState === "speaking" &&
      "bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]",
    !isConnected && "bg-red-400",
  );

  return (
    <AnimatePresence>
      {isSessionStarted && (
        <motion.div
          key="transcript-panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="absolute bottom-[88px] left-1/2 -translate-x-1/2 w-full max-w-[520px] px-6 z-20 pointer-events-none"
        >
          <div className="w-full rounded-[16px] bg-white/[0.03] border border-white/[0.06] backdrop-blur-md overflow-hidden flex flex-col">
            {/* Status row */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.05] flex-shrink-0">
              <div className={dotColor} />
              <span className="text-[11px] font-medium text-white/40 tracking-[0.1em] uppercase truncate">
                {status.replace("🔴", "").replace("🟢", "").trim() || "Status"}
              </span>
            </div>

            {/* Chat messages */}
            <div
              ref={scrollRef}
              className="flex flex-col gap-2 px-4 py-3 max-h-[160px] overflow-y-auto no-scroll"
            >
              <AnimatePresence initial={false}>
                {messages.length === 0 && !isAiThinking ? (
                  <motion.p
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[12px] text-white/25 italic text-center"
                  >
                    Start speaking…
                  </motion.p>
                ) : (
                  <>
                    {messages.map((msg, i) => (
                      <MessageBubble key={i} msg={msg} index={i} />
                    ))}
                    {/* AI Typing indicator */}
                    {isAiThinking && (
                      <motion.div
                        key="typing"
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex justify-start"
                      >
                        <span className="flex items-center gap-1 bg-[#A78BFA]/[0.12] rounded-[12px] rounded-bl-[4px] px-3 py-2">
                          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-white/60" />
                          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-white/60" />
                          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-white/60" />
                        </span>
                      </motion.div>
                    )}
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MessageBubble({ msg, index }) {
  const [showTime, setShowTime] = useState(false);
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.22,
        ease: "easeOut",
        delay: Math.min(index * 0.04, 0.2),
      }}
      className={cn(
        "flex flex-col",
        msg.role === "user" ? "items-end" : "items-start",
      )}
      onMouseEnter={() => setShowTime(true)}
      onMouseLeave={() => setShowTime(false)}
    >
      <span
        className={cn(
          "max-w-[80%] rounded-[12px] px-3 py-1.5 text-[13px] leading-[1.6] font-normal pointer-events-auto",
          msg.role === "user"
            ? "bg-white/[0.08] text-white/90 rounded-br-[4px]"
            : "bg-[#A78BFA]/[0.12] text-white/80 rounded-bl-[4px]",
        )}
      >
        {msg.text}
      </span>
      <AnimatePresence>
        {showTime && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="text-[10px] text-white/25 mt-0.5 px-1"
          >
            {time}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
