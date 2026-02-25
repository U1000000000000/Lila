import { useCallback, useEffect, useRef } from "react";
import { convertPCMToWav } from "../utils/audio";

// Derive WS URL from the current page origin so the Vite proxy handles it.
// Append the JWT token as a query param so the backend can auth WS connections
// (browsers can't set custom headers on WebSocket connections).
function getWsUrl() {
  const token = sessionStorage.getItem("jwt_token");
  const base =
    import.meta.env.VITE_WS_URL ||
    (window.location.protocol === 'https:' ? 'wss' : 'ws') +
      '://' + window.location.host + '/ws';
  return token ? `${base}?token=${token}` : base;
}
const SAMPLE_RATE = 24000;

/**
 * Manages the WebSocket connection, microphone recording, and message routing.
 *
 * @param {{ onStatus, onTranscript, onAudio, onMsgCount, enabled, speechTimeRef }} options
 *   speechTimeRef — optional React ref (MutableRefObject<number>) whose .current
 *   is stamped with Date.now() each time the user sends an audio chunk.
 *   Pass your own ref from the parent component to share the timestamp.
 * @returns {{ wsRef }}
 */
export function useWebSocket({ onStatus, onTranscript, onUserTranscript, onAudio, onMsgCount, enabled = true, speechTimeRef = null }) {
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  
  // Keep fresh references to callbacks so we don't need them in the dependency array
  const callbacksRef = useRef({ onStatus, onTranscript, onUserTranscript, onAudio, onMsgCount });
  useEffect(() => {
    callbacksRef.current = { onStatus, onTranscript, onUserTranscript, onAudio, onMsgCount };
  }, [onStatus, onTranscript, onUserTranscript, onAudio, onMsgCount]);

  // Fallback internal ref if caller did not supply one
  const _internalSpeechRef = useRef(0);
  const lastUserSpeechTime = speechTimeRef ?? _internalSpeechRef;

  const startRecording = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== 1) return;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((s) => {
        streamRef.current = s;
        mediaRecorderRef.current = new window.MediaRecorder(s, { mimeType: "audio/webm" });
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0 && wsRef.current?.readyState === 1) {
            wsRef.current.send(event.data);
            lastUserSpeechTime.current = Date.now();
          }
        };
        mediaRecorderRef.current.onerror = (err) => {
          console.error("MediaRecorder error:", err);
          callbacksRef.current.onStatus("❌ Recording error");
        };
        mediaRecorderRef.current.start(100);
      })
      .catch((err) => {
        console.error("Microphone error:", err);
        callbacksRef.current.onStatus("❌ Microphone access denied");
      });
  }, [lastUserSpeechTime]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    let ws;
    let reconnectTimeout;
    let retryCount = 0;

    function connectWebSocket() {
      ws = new window.WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        retryCount = 0;
        callbacksRef.current.onStatus("🟢 Connected — speak naturally!");
        setTimeout(() => {
          if (wsRef.current && wsRef.current.readyState === 1) startRecording();
        }, 100);
      };

      ws.onmessage = async (message) => {
        // Binary → PCM audio from TTS
        if (message.data instanceof Blob && message.data.size > 0) {
          const buf = await message.data.arrayBuffer();
          const wavBlob = convertPCMToWav(buf, SAMPLE_RATE);
          if (wavBlob) callbacksRef.current.onAudio(URL.createObjectURL(wavBlob));
          return;
        }

        // Text → JSON control message
        try {
          const received = JSON.parse(message.data);
          if (received.type === "ping") return;            // keep-alive
          // AI response text
          if (received.response) {
            callbacksRef.current.onTranscript(received.response);
            callbacksRef.current.onMsgCount((c) => c + 1);
          }
          // User's own speech text (STT)
          if (received.transcript) {
            callbacksRef.current.onUserTranscript?.(received.transcript);
          }
        } catch {
          // ignore malformed
        }
      };

      ws.onclose = (event) => {
        // Clean up microphone
        stopRecording();
        
        // Reconnect unless it was a clean close
        if (retryCount < 5 && event.code !== 1000) {
          retryCount++;
          const delay = Math.min(5000, 1000 * 2 ** retryCount);
          callbacksRef.current.onStatus(`🔴 Reconnecting in ${delay / 1000}s… (${retryCount}/5)`);
          reconnectTimeout = setTimeout(connectWebSocket, delay);
        } else {
          callbacksRef.current.onStatus(event.code === 1000 ? "🔴 Disconnected" : "❌ Connection lost. Refresh the page.");
        }
      };

      ws.onerror = () => callbacksRef.current.onStatus("❌ WebSocket error");
    }

    connectWebSocket();

    // Return cleanup
    return () => {
      retryCount = 99; // prevent reconnects
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      stopRecording();
    };
  }, [stopRecording, startRecording]);

  useEffect(() => {
    // Do NOT open a WebSocket until auth is confirmed — avoids a
    // race where connect() fires before the token is available.
    if (!enabled) return;
    const cleanup = connect();
    return cleanup;
  }, [connect, enabled]);

  return { wsRef, startRecording, stopRecording };
}
