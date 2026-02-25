import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

export default function ControlDeck({
  isSessionStarted,
  onStart,
  onStop,
  status,
}) {
  const isConnecting = status.toLowerCase().includes("connecting");
  const [ripple, setRipple] = useState(false);
  const [shaking, setShaking] = useState(false);

  const handleStart = () => {
    setRipple(true);
    setTimeout(() => setRipple(false), 700);
    onStart();
  };

  const handleStop = () => {
    setShaking(true);
    setTimeout(() => {
      setShaking(false);
      onStop();
    }, 400);
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
      <motion.button
        layout
        onClick={isSessionStarted ? handleStop : handleStart}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "relative flex items-center justify-center rounded-[24px] transition-all duration-300 outline-none overflow-visible",
          !isSessionStarted
            ? "h-[54px] px-8 bg-white/[0.03] backdrop-blur-md border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:bg-white/[0.08] hover:border-white/[0.15] hover:shadow-[0_8px_32px_rgba(255,255,255,0.05)] group"
            : cn(
                "h-[54px] px-8 bg-red-500/[0.05] backdrop-blur-md border border-red-500/[0.15] hover:bg-red-500/[0.1] hover:border-red-500/[0.25] shadow-[0_4px_24px_rgba(239,68,68,0.1)] group",
                shaking && "shake",
              ),
        )}
      >
        {/* Ripple on start click */}
        {ripple && (
          <span className="ripple-ring absolute inset-0 rounded-[24px] border border-white/30 pointer-events-none" />
        )}

        <AnimatePresence mode="popLayout">
          {!isSessionStarted ? (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 relative w-full h-full justify-center"
            >
              <Mic
                className={cn(
                  "w-[16px] h-[16px] text-white/70 group-hover:text-white transition-colors duration-300",
                )}
                strokeWidth={2}
              />
              <span className="text-[14px] font-medium tracking-wide text-white/80 group-hover:text-white transition-colors duration-300">
                Start Session
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="stop"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 justify-center text-red-400/90 group-hover:text-red-400 transition-colors duration-300"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-[16px] h-[16px] animate-spin" />
                  <span className="text-[14px] font-medium tracking-wide">
                    Connecting
                  </span>
                </>
              ) : (
                <>
                  <Square
                    className={cn(
                      "w-[14px] h-[14px] fill-current",
                      isSessionStarted && "mic-breathe",
                    )}
                  />
                  <span className="text-[14px] font-medium tracking-wide">
                    End Session
                  </span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
