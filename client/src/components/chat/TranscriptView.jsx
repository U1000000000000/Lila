/**
 * TranscriptView — placeholder.
 * Will show the live running transcript of Lila's speech.
 */
export default function TranscriptView({ text = "" }) {
  return (
    <div className="h-24 overflow-y-auto bg-gray-700 rounded p-2 text-sm text-gray-200">
      {text || <span className="text-gray-500">Transcript will appear here…</span>}
    </div>
  );
}
