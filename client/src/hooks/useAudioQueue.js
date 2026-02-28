import { useCallback, useEffect, useRef } from "react";

/**
 * Manages a sequential audio playback queue.
 *
 * @param {{ onPlay, onEnd }} options
 *   onPlay() — called the moment each audio clip starts playing
 *   onEnd()  — called the moment each audio clip finishes (or errors/skips)
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

    const MIN_AUDIO_SIZE = 1000;

    fetch(nextUrl)
      .then(res => res.blob())
      .then(blob => {
        if (blob.size < MIN_AUDIO_SIZE) {
          console.warn("[AudioQueue] Skipping tiny blob (", blob.size, "bytes)");
          URL.revokeObjectURL(nextUrl);
          isPlayingRef.current = false;
          onEndRef.current?.();
          playNextRef.current?.();
          return;
        }
        audio.src = nextUrl;
        audio.onended = () => {
          URL.revokeObjectURL(nextUrl);
          isPlayingRef.current = false;
          onEndRef.current?.();   // ← caption hides here
          playNextRef.current?.();
        };
        audio.onerror = () => {
          console.error("[AudioQueue] Playback error");
          URL.revokeObjectURL(nextUrl);
          isPlayingRef.current = false;
          onEndRef.current?.();
          playNextRef.current?.();
        };
        audio.play()
          .then(() => {
            onPlayRef.current?.();  // ← caption shows here
          })
          .catch(() => {
            URL.revokeObjectURL(nextUrl);
            isPlayingRef.current = false;
            onEndRef.current?.();
            playNextRef.current?.();
          });
      })
      .catch(() => {
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
