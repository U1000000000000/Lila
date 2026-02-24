/**
 * ChatWindow — placeholder.
 * Will render the scrollable message thread (user + Lila bubbles).
 */
export default function ChatWindow({ messages = [] }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {messages.map((m, i) => (
        <p key={i} className="text-sm text-gray-300">{m}</p>
      ))}
    </div>
  );
}
