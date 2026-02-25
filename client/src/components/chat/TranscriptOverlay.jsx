import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../utils/cn";

export default function TranscriptOverlay({ transcript, isSessionStarted }) {
  return (
    <div
      className={cn(
        "absolute bottom-40 left-1/2 -translate-x-1/2 w-full max-w-[700px] px-8 z-20 pointer-events-none transition-all duration-1000 ease-out",
        isSessionStarted
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-12",
      )}
    >
      {/* We use a mask-image to fade out the top of the transcript text organically */}
      <div
        className="max-h-[160px] overflow-hidden flex flex-col justify-end pb-4"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent, black 40%, black 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 40%, black 100%)",
        }}
      >
        <AnimatePresence mode="wait">
          {!transcript ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.3, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-[18px] text-center italic text-white/50 tracking-wide font-light"
            >
              Start speaking, Lila is listening...
            </motion.p>
          ) : (
            <motion.p
              key="transcript"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[20px] md:text-[24px] text-center leading-relaxed text-white/95 font-medium tracking-wide drop-shadow-md"
            >
              {transcript}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
