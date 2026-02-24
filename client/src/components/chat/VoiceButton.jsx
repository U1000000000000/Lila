/**
 * VoiceButton — placeholder.
 * Will be a press-to-talk / always-on toggle button with animation.
 */
export default function VoiceButton({ active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition ${
        active ? "bg-red-500 animate-pulse" : "bg-indigo-600 hover:bg-indigo-500"
      }`}
    >
      🎙
    </button>
  );
}
