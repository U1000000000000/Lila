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

  const MIN_AUDIO_SIZE = 1000; // bytes, skip blobs smaller than this
  const playNext = useCallback(() => {
    if (isPlayingRef.current || queueRef.current.length === 0) return;
    isPlayingRef.current = true;

    const nextUrl = queueRef.current.shift();
    const audio = audioRef.current;
    if (!audio) {
      isPlayingRef.current = false;
      return;
    }

    // Fetch the blob and check its size before playing
    fetch(nextUrl)
      .then(res => res.blob())
      .then(blob => {
        if (blob.size < MIN_AUDIO_SIZE) {
          // Too small to be valid audio, skip
          console.warn("[AudioQueue] Skipping tiny audio blob (", blob.size, "bytes)");
          URL.revokeObjectURL(nextUrl);
          isPlayingRef.current = false;
          playNext();
          return;
        }
        audio.src = nextUrl;
        audio.onended = () => {
          URL.revokeObjectURL(nextUrl);
          isPlayingRef.current = false;
          playNext();
        };
        audio.onerror = () => {
          console.error("[AudioQueue] Audio playback error");
          URL.revokeObjectURL(nextUrl);
          isPlayingRef.current = false;
          playNext();
        };
        audio.play().catch(() => {
          // If playback fails, clean up and try the next audio
          URL.revokeObjectURL(nextUrl);
          isPlayingRef.current = false;
          playNext();
        });
      })
      .catch(() => {
        // If blob fetch fails, skip
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
