/**
 * PageLoader — thin top progress bar shown on every route change.
 * Matches the Lila purple design system.
 * Used inside BrowserRouter so it can access useLocation.
 */
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function PageLoader() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Reset and start — all inside timers to avoid synchronous setState in effect
    const start = setTimeout(() => {
      setProgress(0);
      setVisible(true);
    }, 0);
    const toMid = setTimeout(() => setProgress(82), 40);
    const toFull = setTimeout(() => setProgress(100), 360);
    const hide = setTimeout(() => setVisible(false), 660);

    return () => {
      clearTimeout(start);
      clearTimeout(toMid);
      clearTimeout(toFull);
      clearTimeout(hide);
    };
  }, [pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={pathname}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none"
        >
          {/* Track */}
          <div className="absolute inset-0 bg-white/[0.04]" />

          {/* Bar */}
          <motion.div
            className="absolute top-0 left-0 h-full rounded-r-full"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #7C3AED, #A78BFA, #C4B5FD)",
              boxShadow: "0 0 8px rgba(167,139,250,0.6)",
            }}
            transition={{
              duration: progress === 100 ? 0.2 : 0.4,
              ease: "easeOut",
            }}
            animate={{ width: `${progress}%` }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
