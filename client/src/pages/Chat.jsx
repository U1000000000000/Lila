import React, { useCallback, useRef, useState } from "react";
import { useAudioQueue } from "../hooks/useAudioQueue";
import { useWebSocket } from "../hooks/useWebSocket";
import Logo from "../components/ui/Logo";
import VoiceBlob from "../components/chat/VoiceBlob";
import TranscriptOverlay from "../components/chat/TranscriptOverlay";
import ControlDeck from "../components/chat/ControlDeck";
import { LayoutDashboard, User } from "lucide-react";

export default function Chat() {
  const [status, setStatus] = useState("🔴 Not Connected");
  const [transcript, setTranscript] = useState("");
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [blobState, setBlobState] = useState("idle");

  const lastUserSpeechTime = useRef(0);
  const { audioRef, push: pushAudio } = useAudioQueue();

  const handleAudio = useCallback(
    (url) => {
      lastUserSpeechTime.current = Date.now();
      pushAudio(url);
    },
    [pushAudio],
  );

  const handleTranscript = useCallback((text) => {
    setTranscript((t) => t + text + " ");
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
      } else if (
        sLower.includes("process") ||
        sLower.includes("handl") ||
        sLower.includes("think") ||
        sLower.includes("comput")
      ) {
        setBlobState("computing");
      } else {
        setBlobState("listening"); // default when connected and not actively speaking/processing
      }
    },
    onTranscript: handleTranscript,
    onAudio: handleAudio,
    enabled: isSessionStarted,
  });

  const handleStopSession = useCallback(() => {
    setIsSessionStarted(false);
    setBlobState("idle");
    setStatus("🔴 Not Connected");
    setTranscript("");
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans relative flex flex-col items-center justify-center selection:bg-[#A78BFA]/30 selection:text-white overflow-hidden">
      {/* 1. Ambient Generative Background Noise */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-screen"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* 2. Deep purple glowing orbs (Static) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[900px] md:h-[900px] bg-[#A78BFA] rounded-full opacity-[0.06] blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-[40%] left-[60%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[400px] bg-[#8B5CF6] rounded-full opacity-[0.04] blur-[100px] pointer-events-none z-0"></div>

      {/* 2. 3D Voice Blob with Post Processing Bloom */}
      <VoiceBlob state={isSessionStarted ? blobState : "idle"} />

      {/* 3. Header / Logo */}
      <div className="absolute top-8 left-8 md:top-12 md:left-12 flex items-center gap-3 select-none z-20 opacity-90 hover:opacity-100 transition-opacity">
        <Logo className="w-8 h-8" glow />
        <span className="text-white/90 text-[20px] font-medium tracking-wide drop-shadow-md">
          Lila
        </span>
      </div>

      {/* Top Right Navigation */}
      <div className="absolute top-8 right-8 md:top-12 md:right-12 flex items-center gap-4 z-20">
        <button className="group flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/[0.02] border border-white/[0.05] text-white/70 font-medium text-[13px] tracking-wide hover:bg-white/[0.06] hover:text-white hover:border-white/[0.15] hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all duration-300 backdrop-blur-xl">
          <LayoutDashboard className="w-4 h-4 text-white/50 group-hover:text-white transition-colors duration-300" />
          Dashboard
        </button>
        <button className="group relative flex items-center justify-center w-[42px] h-[42px] rounded-full bg-white/[0.02] border border-white/[0.05] text-white/70 hover:bg-white/[0.06] hover:text-white hover:border-white/[0.15] hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all duration-300 backdrop-blur-xl overflow-hidden">
          <User className="w-4 h-4 text-white/50 group-hover:text-white transition-colors duration-300 relative z-10" />
        </button>
      </div>

      {/* 4. Cinematic Transcript Overlay */}
      <TranscriptOverlay
        transcript={transcript}
        isSessionStarted={isSessionStarted}
      />

      {/* 5. Production Grade Control Deck (Start/Stop & Status) */}
      <ControlDeck
        isSessionStarted={isSessionStarted}
        status={status}
        blobState={blobState}
        onStart={() => setIsSessionStarted(true)}
        onStop={handleStopSession}
      />

      {/* Hidden audio element for TTS queue */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
