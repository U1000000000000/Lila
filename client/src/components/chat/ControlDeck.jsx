import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

export default function ControlDeck({
  isSessionStarted,
  onStart,
  onStop,
  status,
  blobState,
}) {
  const isConnecting = status.toLowerCase().includes("connecting");
  const isConnected = isSessionStarted && !status.includes("🔴");

  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
      {/* Status Pill */}
      <AnimatePresence>
        {isSessionStarted && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="mb-6 flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md"
          >
            <div
              className={cn(
                "w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-colors duration-500",
                blobState === "idle" && "bg-white/40",
                blobState === "listening" && "bg-[#A78BFA]",
                blobState === "computing" && "bg-[#C4B5FD]",
                blobState === "speaking" && "bg-white",
                !isConnected && "bg-red-400",
              )}
            />
            <span className="text-[12px] font-medium text-white/70 tracking-widest uppercase">
              {status.replace("🔴", "").replace("🟢", "").trim() || "Status"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Action Button */}
      <motion.button
        layout
        onClick={isSessionStarted ? onStop : onStart}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative flex items-center justify-center rounded-full transition-all duration-500 ease-out overflow-hidden group outline-none",
          !isSessionStarted
            ? "h-[56px] w-[210px] bg-transparent backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] hover:bg-white/10 hover:border-white/60 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]"
            : "h-[64px] w-[64px] bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)] backdrop-blur-3xl",
        )}
      >
        <AnimatePresence mode="popLayout">
          {!isSessionStarted ? (
            <motion.div
              key="start"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-3 text-white/90 font-medium tracking-wide relative w-full h-full justify-center"
            >
              {/* Premium Hover Effects - Monochrome UI */}
              {/* 1. Shimmer sweep */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none rounded-full"></div>
              {/* 2. Top-down inner rim light */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay"></div>
              {/* 3. Base subtle glow */}
              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,transparent_70%)] pointer-events-none"></div>

              {/* Content */}
              <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.04] border border-white/10 group-hover:bg-white group-hover:border-white group-hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all duration-300">
                <Mic className="w-4 h-4 text-white/70 group-hover:text-black transition-colors duration-300" />
              </div>
              <span className="relative z-10 group-hover:text-white transition-colors duration-300">
                Start Session
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="stop"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center justify-center text-red-400"
            >
              {isConnecting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Square className="w-5 h-5 fill-current" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
