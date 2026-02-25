import React, { useEffect, useRef } from "react";

/**
 * GlowCursor — a translucent glowing orb that follows the actual cursor.
 * Rendered at the root Chat level so it covers the whole viewport.
 */
export default function GlowCursor() {
  const dotRef = useRef(null);
  const glowRef = useRef(null);
  const pos = useRef({ x: -100, y: -100 });
  const glow = useRef({ x: -100, y: -100 });
  const raf = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);

    const loop = () => {
      // Dot follows instantly
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x - 4}px, ${pos.current.y - 4}px)`;
      }
      // Glow lags behind for a smooth trail
      glow.current.x += (pos.current.x - glow.current.x) * 0.08;
      glow.current.y += (pos.current.y - glow.current.y) * 0.08;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${glow.current.x - 160}px, ${glow.current.y - 160}px)`;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <>
      {/* Precise dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[9999] pointer-events-none w-2 h-2 rounded-full bg-white/80"
        style={{ willChange: "transform" }}
      />
      {/* Soft trailing glow */}
      <div
        ref={glowRef}
        className="fixed top-0 left-0 z-[9998] pointer-events-none w-[320px] h-[320px] rounded-full"
        style={{
          willChange: "transform",
          background:
            "radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)",
        }}
      />
    </>
  );
}
