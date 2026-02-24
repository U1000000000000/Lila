/**
 * StatusBadge — shows connection / recording state.
 * Usage: <StatusBadge status="connected" />
 */
const COLORS = {
  connected: "bg-green-500",
  disconnected: "bg-red-500",
  connecting: "bg-yellow-500 animate-pulse",
  error: "bg-red-700",
};

export default function StatusBadge({ label = "", status = "disconnected" }) {
  return (
    <span className="flex items-center gap-2 text-sm">
      <span className={`w-2.5 h-2.5 rounded-full ${COLORS[status] ?? "bg-gray-500"}`} />
      {label}
    </span>
  );
}
