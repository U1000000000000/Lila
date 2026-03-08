import { useCallback, useEffect, useRef } from "react";

/**
 * Manages a sequential audio playback queue.
 *
 * All audio URLs pushed here are assumed valid and large enough to play —
 * the size check is done upstream (in useWebSocket) before the URL is created.
 *
 * Critically, event handlers are attached BEFORE audio.src is set so there is
 * no window where `onended` could fire without a handler registered, which
 * would leave isPlayingRef stuck as `true` and freeze the queue.
 *
 * @param {{ onPlay, onEnd }} options
 *   onPlay() — called the moment each audio clip starts playing
 *   onEnd()  — called the moment each audio clip finishes (or errors)
 * @returns {{ audioRef, push }}
 */
export function useAudioQueue({ onPlay, onEnd } = {}) {
  const audioRef = useRef(null);
  const queueRef = useRef([]);
  const isPlayingRef = useRef(false);

  const onPlayRef = useRef(onPlay);
  const onEndRef = useRef(onEnd);
  useEffect(() => { onPlayRef.current = onPlay; }, [onPlay]);
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);

  const playNextRef = useRef(null);
  const playNextFn = useCallback(() => {
    if (isPlayingRef.current || queueRef.current.length === 0) return;
    isPlayingRef.current = true;

    const nextUrl = queueRef.current.shift();
    const audio = audioRef.current;
    if (!audio) {
      isPlayingRef.current = false;
      return;
    }

    // ── Handlers BEFORE src ──────────────────────────────────────────────────
    // Setting audio.src starts the browser's decode pipeline immediately for
    // blob: URLs (in-memory). If onended were attached after src, a very short
    // clip could finish decoding + playing before the handler was registered,
    // leaving isPlayingRef permanently true and freezing the queue.
    audio.onended = () => {
      URL.revokeObjectURL(nextUrl);
      isPlayingRef.current = false;
      onEndRef.current?.();
      playNextRef.current?.();
    };
    audio.onerror = () => {
      console.error("[AudioQueue] Playback error");
      URL.revokeObjectURL(nextUrl);
      isPlayingRef.current = false;
      onEndRef.current?.();
      playNextRef.current?.();
    };

    // ── Src after handlers ───────────────────────────────────────────────────
    audio.src = nextUrl;

    audio.play()
      .then(() => {
        onPlayRef.current?.();
      })
      .catch((err) => {
        console.error("[AudioQueue] play() rejected:", err);
        URL.revokeObjectURL(nextUrl);
        isPlayingRef.current = false;
        onEndRef.current?.();
        playNextRef.current?.();
      });
  }, []);

  useEffect(() => { playNextRef.current = playNextFn; }, [playNextFn]);

  const push = useCallback((url) => {
    queueRef.current.push(url);
    playNextRef.current?.();
  }, []);

  return { audioRef, push };
}
