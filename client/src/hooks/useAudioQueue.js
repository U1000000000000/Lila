import { useCallback, useRef } from "react";

/**
 * Manages a sequential audio playback queue.
 * Audio URLs are played one at a time; object URLs are revoked after use.
 *
 * @returns {{ audioRef, push }}
 *   audioRef — attach to an <audio> element
 *   push(url) — enqueue a blob URL for playback
 */
export function useAudioQueue() {
  const audioRef = useRef(null);
  const queueRef = useRef([]);
  const isPlayingRef = useRef(false);

  const playNext = useCallback(() => {
    if (isPlayingRef.current || queueRef.current.length === 0) return;
    isPlayingRef.current = true;

    const nextUrl = queueRef.current.shift();
    const audio = audioRef.current;
    if (!audio) return;

    audio.src = nextUrl;
    audio.play()
      .then(() => {
        audio.onended = () => {
          URL.revokeObjectURL(nextUrl);
          isPlayingRef.current = false;
          playNext();
        };
      })
      .catch(() => {
        URL.revokeObjectURL(nextUrl);
        isPlayingRef.current = false;
        playNext();
      });
  }, []);

  const push = useCallback(
    (url) => {
      queueRef.current.push(url);
      playNext();
    },
    [playNext]
  );

  return { audioRef, push };
}
