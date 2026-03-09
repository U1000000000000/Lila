import { useCallback, useEffect, useRef } from "react";
import { convertPCMToWav } from "../utils/audio";

// Always derive the WS URL from the current page origin so the Vite proxy
// handles it in dev (ws://localhost:5173/ws → ws://localhost:8000/ws).
// HttpOnly cookies are sent automatically on WebSocket handshakes — no token
// in the URL needed.
// In production, set VITE_WS_BASE_URL=wss://api.example.com if cross-origin.
function getWsUrl() {
  const override = import.meta.env.VITE_WS_BASE_URL;
  if (override) return override;
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}/ws`;
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

      // Minimum raw PCM bytes considered real speech.
      // Deepgram occasionally flushes a tiny trailing frame — skip it so the
      // audio queue never receives a near-silent clip that would advance the
      // caption queue without playing audible speech.
      const MIN_AUDIO_BYTES = 1000;

      // Accumulates raw PCM binary frames between a tts_start and tts_end
      // marker pair. Reset on every new sentence start.
      let ttsChunks = [];

      ws.onmessage = async (message) => {
        // ── Binary: streaming PCM chunk from Deepgram TTS ─────────────────────
        // Chunks arrive continuously while Deepgram generates audio (~150 ms
        // after the TTS request). We accumulate them in memory and assemble
        // a single WAV blob on tts_end — much cheaper than re-fetching.
        if (message.data instanceof Blob && message.data.size > 0) {
          const buf = await message.data.arrayBuffer();
          ttsChunks.push(buf);
          return;
        }

        // ── Text: JSON control message ─────────────────────────────────────────
        try {
          const received = JSON.parse(message.data);
          if (received.type === "ping") return; // keep-alive

          // ── Sentence start ────────────────────────────────────────────────────
          // Server sends this immediately before the first PCM chunk for a
          // sentence. Queue the caption now; audio will follow via tts_end.
          if (received.type === "tts_start") {
            ttsChunks = []; // reset for this sentence
            callbacksRef.current.onTranscript(received.response);
            callbacksRef.current.onMsgCount((c) => c + 1);
            return;
          }

          // ── Sentence end ──────────────────────────────────────────────────────
          // All PCM chunks for this sentence have arrived. Assemble into a single
          // contiguous buffer, convert to WAV, and push to the audio queue.
          // This assembles from in-memory ArrayBuffers — effectively free.
          if (received.type === "tts_end") {
            const totalBytes = ttsChunks.reduce((s, b) => s + b.byteLength, 0);
            if (totalBytes >= MIN_AUDIO_BYTES) {
              const combined = new Uint8Array(totalBytes);
              let offset = 0;
              for (const buf of ttsChunks) {
                combined.set(new Uint8Array(buf), offset);
                offset += buf.byteLength;
              }
              const wavBlob = convertPCMToWav(combined.buffer, SAMPLE_RATE);
              if (wavBlob) {
                callbacksRef.current.onAudio(URL.createObjectURL(wavBlob));
              }
            } else if (totalBytes > 0) {
              console.warn("[WS] Skipping tiny TTS sentence (", totalBytes, "bytes)");
            }
            ttsChunks = [];
            return;
          }

          // ── User's own STT transcript ─────────────────────────────────────────
          // Server forwards both interim (live preview) and final (confirmed)
          // Deepgram results. Pass is_final so the UI can distinguish:
          //   interim → update displayed text in place (live-typing effect)
          //   final   → start the auto-clear countdown
          if (received.transcript) {
            callbacksRef.current.onUserTranscript?.(received.transcript, received.is_final ?? true);
          }
        } catch {
          // ignore malformed frames
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
