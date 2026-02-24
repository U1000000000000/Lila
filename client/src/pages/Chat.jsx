import React, { useCallback, useRef, useState } from "react";
import { useAudioQueue } from "../hooks/useAudioQueue";
import { useWebSocket } from "../hooks/useWebSocket";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Chat() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // All hooks must be declared before any early returns (Rules of Hooks)
  const [status, setStatus] = useState("🔴 Not Connected");
  const [transcript, setTranscript] = useState("");
  const [msgCount, setMsgCount] = useState(0);
  const [responseTime, setResponseTime] = useState("--");

  // Owned here, passed into the hook so both sides share the same object.
  // The hook stamps .current on every audio chunk; handleAudio reads it.
  const lastUserSpeechTime = useRef(0);
  const { audioRef, push: pushAudio } = useAudioQueue();

  const handleAudio = useCallback(
    (url) => {
      const rTime = Date.now() - lastUserSpeechTime.current;
      setResponseTime(`${rTime}ms`);
      pushAudio(url);
    },
    [pushAudio]
  );

  const handleTranscript = useCallback((text) => {
    setTranscript((t) => t + text + " ");
  }, []);

  useWebSocket({
    onStatus: setStatus,
    onTranscript: handleTranscript,
    onAudio: handleAudio,
    onMsgCount: setMsgCount,
    // Hook will write to this ref each time the user sends audio
    speechTimeRef: lastUserSpeechTime,
    // Don't connect until auth is confirmed
    enabled: !loading && isAuthenticated,
  });

  // Redirect unauthenticated users only after the async check resolves
  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [loading, isAuthenticated, navigate]);

  // ── Early returns (AFTER all hooks) ────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // navigate() was already called in the effect; render nothing while it fires
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl p-6 bg-gray-800 rounded shadow-lg">
        <h1 className="text-2xl font-bold mb-2">Voice Chat</h1>
        <p className="mb-2">{status}</p>
        <p className="mb-2 text-sm text-gray-400">
          ⚡ Response:{" "}
          <span className="font-mono text-white">{responseTime}</span>
          {" | "}
          💬 Messages:{" "}
          <span className="font-mono text-white">{msgCount}</span>
        </p>
        <div className="mb-4 h-32 overflow-y-auto bg-gray-700 rounded p-2 text-sm">
          {transcript || <span className="text-gray-500">Assistant will speak here…</span>}
        </div>
        <audio ref={audioRef} className="w-full mt-2" />
      </div>
    </div>
  );
}
