import React, { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAudioQueue } from "../hooks/useAudioQueue";
import { useWebSocket } from "../hooks/useWebSocket";
import Logo from "../components/ui/Logo";
import VoiceBlob from "../components/chat/VoiceBlob";
import TranscriptOverlay from "../components/chat/TranscriptOverlay";
import ControlDeck from "../components/chat/ControlDeck";
import Footer from "../components/ui/Footer";
import { motion } from "framer-motion";
import { LayoutDashboard, User } from "lucide-react";

export default function Chat() {
  const { isAuthenticated, loading } = useAuth();

  const [status, setStatus] = useState("🔴 Not Connected");
  const [messages, setMessages] = useState([]);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [blobState, setBlobState] = useState("idle");
  const [isAiThinking, setIsAiThinking] = useState(false);

  const lastUserSpeechTime = useRef(0);
  const { audioRef, push: pushAudio } = useAudioQueue();

  const handleAudio = useCallback(
    (url) => {
      lastUserSpeechTime.current = Date.now();
      setIsAiThinking(false);
      pushAudio(url);
    },
    [pushAudio],
  );

  const handleTranscript = useCallback((text) => {
    setIsAiThinking(false);
    setMessages((prev) => [...prev, { role: "ai", text }]);
  }, []);

  const handleUserTranscript = useCallback((text) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setIsAiThinking(true); // user spoke → AI is now thinking
  }, []);

  useWebSocket({
    onStatus: (s) => {
      setStatus(s);

      if (!isSessionStarted) {
        setBlobState("idle");
        return;
      }

      const sLower = s.toLowerCase();
      if (sLower.includes("speak")) {
        setBlobState("speaking");
        setIsAiThinking(false);
      } else if (
        sLower.includes("process") ||
        sLower.includes("handl") ||
        sLower.includes("think") ||
        sLower.includes("comput")
      ) {
        setBlobState("computing");
        setIsAiThinking(true);
      } else {
        setBlobState("listening");
      }
    },
    onTranscript: handleTranscript,
    onUserTranscript: handleUserTranscript,
    onAudio: handleAudio,
    onMsgCount: () => {},
    speechTimeRef: lastUserSpeechTime,
    enabled: !loading && isAuthenticated && isSessionStarted,
  });

  const handleStartSession = useCallback(() => {
    setIsSessionStarted(true);
    setMessages([]);
    setIsAiThinking(false);
    setBlobState("listening");
  }, []);

  const handleStopSession = useCallback(() => {
    setIsSessionStarted(false);
    setIsAiThinking(false);
    setBlobState("idle");
  }, []);

  const navigate = useNavigate();

  return (
    <div className="bg-black text-white font-sans selection:bg-[#A78BFA]/30 selection:text-white flex flex-col">
      {/* ── Chat viewport ──────────────────────────────────── */}
      <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden">
        {/* 1. Ambient Generative Background Noise */}
        <div
          className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-screen"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* 2. Drifting ambient orbs */}
        <motion.div
          className="fixed top-1/2 left-1/2 w-[600px] h-[600px] md:w-[900px] md:h-[900px] bg-[#A78BFA] rounded-full opacity-[0.06] blur-[120px] pointer-events-none z-0"
          animate={{
            x: ["-50%", "-48%", "-52%", "-50%"],
            y: ["-50%", "-52%", "-48%", "-50%"],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: "50%", left: "50%" }}
        />
        <motion.div
          className="fixed w-[300px] h-[400px] bg-[#8B5CF6] rounded-full opacity-[0.04] blur-[100px] pointer-events-none z-0"
          animate={{
            x: ["-50%", "-53%", "-47%", "-50%"],
            y: ["-50%", "-47%", "-53%", "-50%"],
          }}
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
          style={{ top: "40%", left: "60%" }}
        />

        {/* 3. 3D Voice Blob */}
        <VoiceBlob state={isSessionStarted ? blobState : "idle"} />

        {/* 4. Header / Logo with hover animation */}
        {/* ── Absolutely Positioned Header to Match Login & AppShell ─── */}
        <header className="absolute inset-x-0 top-0 z-30 h-24 pointer-events-none">
          {/* Left: Logo */}
          <div
            className="absolute top-8 left-8 md:top-12 md:left-12 flex items-center gap-3 select-none cursor-pointer pointer-events-auto opacity-90 hover:opacity-100 transition-opacity"
            onClick={() => navigate("/chat")}
          >
            <motion.div
              whileHover={{ rotate: [0, -8, 8, -4, 0] }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <Logo className="w-8 h-8" glow />
            </motion.div>
            <span className="text-white/90 text-[20px] font-medium tracking-wide">
              Lila
            </span>
          </div>

          {/* Right side: Navigation & Profile */}
          <div className="absolute top-8 right-8 md:top-12 md:right-12 flex items-center gap-3 pointer-events-auto">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2.5 px-5 h-10 bg-white/[0.03] backdrop-blur-md border border-white/[0.08] rounded-full text-white/70 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.15] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_32px_-8px_rgba(255,255,255,0.05)] transition-all duration-300"
            >
              <LayoutDashboard className="w-[14px] h-[14px]" strokeWidth={2} />
              <span className="text-[13px] font-medium tracking-wide">
                Dashboard
              </span>
            </button>
            <button className="flex items-center justify-center w-10 h-10 bg-white/[0.03] backdrop-blur-md border border-white/[0.08] rounded-full hover:bg-white/[0.08] hover:border-white/[0.15] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_32px_-8px_rgba(255,255,255,0.05)] transition-all duration-300">
              <User
                className="w-[18px] h-[18px]"
                strokeWidth={1.8}
                color="rgba(255,255,255,0.7)"
              />
            </button>
          </div>
        </header>

        {/* 6. Transcript */}
        <TranscriptOverlay
          messages={messages}
          isSessionStarted={isSessionStarted}
          status={status}
          blobState={blobState}
          isAiThinking={isAiThinking}
        />

        {/* 7. Control Deck */}
        <ControlDeck
          isSessionStarted={isSessionStarted}
          status={status}
          onStart={handleStartSession}
          onStop={handleStopSession}
        />

        <audio ref={audioRef} className="hidden" />
      </div>
      {/* end chat viewport */}
      <Footer />
    </div>
  );
}
