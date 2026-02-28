import React from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Live caption strip — visible exactly while audio is playing.
 * aiCaption is set when audio starts and cleared when audio ends.
 * No timers needed — the audio queue drives visibility.
 */
export default function TranscriptOverlay({
  aiCaption = "",
  isSessionStarted,
}) {
  const show = isSessionStarted && !!aiCaption;

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          key={aiCaption}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute bottom-[88px] left-1/2 -translate-x-1/2 z-20 pointer-events-none w-full max-w-[560px] px-8 flex justify-center"
        >
          <p
            className="text-center text-white/90 text-[17px] font-light leading-relaxed tracking-wide"
            style={{
              textShadow:
                "0 0 24px rgba(167,139,250,0.35), 0 2px 8px rgba(0,0,0,0.6)",
            }}
          >
            {aiCaption}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
