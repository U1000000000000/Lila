/**
 * Chat Store — Zustand reactive store.
 *
 * Holds conversation UI state that multiple components may need to read.
 * All state changes trigger re-renders in subscribing components automatically
 * — this is what a plain object return value cannot do.
 *
 * Usage:
 *   const { messages, addMessage } = useChatStore();
 */
import { create } from "zustand";

export const useChatStore = create((set) => ({
  /** All messages in the current session, newest last. */
  messages: [],

  /** WebSocket connection status string shown in the UI. */
  status: "disconnected",

  /** Latest AI response text fragment (for transcript overlay). */
  transcript: "",

  /** Latest STT transcription of the user's own voice. */
  userTranscript: "",

  /** Append a message object { role, content } to the session. */
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  /** Replace the connection status label. */
  setStatus: (status) => set({ status }),

  /** Append a text fragment to the current AI transcript. */
  appendTranscript: (text) =>
    set((s) => ({ transcript: s.transcript + text })),

  /** Set the latest user speech transcription. */
  setUserTranscript: (text) => set({ userTranscript: text }),

  /** Clear the store back to initial state (call on session end). */
  reset: () =>
    set({ messages: [], status: "disconnected", transcript: "", userTranscript: "" }),
}));
