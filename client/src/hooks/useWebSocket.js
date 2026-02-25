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
 * @param {{ onStatus, onTranscript, onAudio, onMsgCount }} callbacks
 * @returns {{ wsRef, lastUserSpeechTime }}
 */
export function useWebSocket({ onStatus, onTranscript, onAudio, onMsgCount, enabled = true }) {
  const wsRef = useRef(null);
  const lastUserSpeechTime = useRef(0);

  // Keep latest callbacks in refs so we don't reconnect purely because a function changed
  const callbacksRef = useRef({ onStatus, onTranscript, onAudio, onMsgCount });
  useEffect(() => {
    callbacksRef.current = { onStatus, onTranscript, onAudio, onMsgCount };
  }, [onStatus, onTranscript, onAudio, onMsgCount]);

  const connect = useCallback(() => {
    let ws;
    let reconnectTimeout;
    let mediaRecorder;
    let stream;
    let retryCount = 0;

    function connectWebSocket() {
      ws = new window.WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        retryCount = 0;
        callbacksRef.current.onStatus("🟢 Connected — speak naturally!");
        setTimeout(() => {

          if (ws.readyState === 1) startRecording();
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
          if (received.response) {
            callbacksRef.current.onTranscript(received.response);
            callbacksRef.current.onMsgCount((c) => c + 1);
          }
        } catch {
          // ignore malformed
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        // Clean up microphone
        if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
          stream = null;
        }
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

    function startRecording() {
      if (!ws || ws.readyState !== 1) return;

      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((s) => {
          stream = s;
          mediaRecorder = new window.MediaRecorder(stream, { mimeType: "audio/webm" });
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0 && ws?.readyState === 1) {
              ws.send(event.data);
              lastUserSpeechTime.current = Date.now();
            }
          };
          mediaRecorder.onerror = (err) => {
            console.error("MediaRecorder error:", err);
            callbacksRef.current.onStatus("❌ Recording error");
          };
          mediaRecorder.start(100);
        })
        .catch((err) => {
          console.error("Microphone error:", err);
          callbacksRef.current.onStatus("❌ Microphone access denied");
        });
    }

    connectWebSocket();

    // Return cleanup
    return () => {
      retryCount = 99; // prevent reconnects
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const cleanup = connect();
    return cleanup;
  }, [connect, enabled]);

  return { wsRef, lastUserSpeechTime };
}
