/**
 * Chat Store — Zustand (placeholder).
 * Will hold active conversation messages, connection state, audio queue state.
 *
 * import { create } from "zustand";
 *
 * export const useChatStore = create((set) => ({
 *   messages: [],
 *   status: "disconnected",
 *   transcript: "",
 *   addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
 *   setStatus: (status) => set({ status }),
 *   appendTranscript: (text) => set((s) => ({ transcript: s.transcript + text })),
 * }));
 */

// Placeholder export so imports don't break
export const useChatStore = () => ({
  messages: [],
  status: "disconnected",
  transcript: "",
});
