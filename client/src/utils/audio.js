/**
 * Wraps raw PCM audio bytes in a WAV container so the browser can play them.
 *
 * @param {ArrayBuffer} arrayBuffer - Raw PCM audio data from Deepgram TTS
 * @param {number} sampleRate       - Sample rate (e.g. 24000)
 * @returns {Blob}                  - WAV audio blob
 */
export function convertPCMToWav(arrayBuffer, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + arrayBuffer.byteLength, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, "data");
  view.setUint32(40, arrayBuffer.byteLength, true);

  const wavBytes = new Uint8Array(44 + arrayBuffer.byteLength);
  wavBytes.set(new Uint8Array(wavHeader), 0);
  wavBytes.set(new Uint8Array(arrayBuffer), 44);

  return new Blob([wavBytes], { type: "audio/wav" });
}
