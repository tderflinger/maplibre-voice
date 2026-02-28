/**
 * VoiceRecorder — captures microphone audio via the Web Audio API,
 * records in fixed-duration chunks (default 5 seconds), and yields
 * each chunk as a WAV Blob for the Mistral transcription API.
 */

const TARGET_SAMPLE_RATE = 16000;
const BUFFER_SIZE = 4096;
const DEFAULT_CHUNK_DURATION_MS = 5000;

export class VoiceRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;

  /** PCM samples accumulated for the current chunk */
  private currentChunk: Uint8Array[] = [];
  /** Completed WAV blobs ready for consumption */
  private readyChunks: Blob[] = [];

  private chunkReady: (() => void) | null = null;
  private recording = false;
  private stopped = false;
  private chunkDurationMs: number;
  private chunkTimer: ReturnType<typeof setInterval> | null = null;

  constructor(chunkDurationMs = DEFAULT_CHUNK_DURATION_MS) {
    this.chunkDurationMs = chunkDurationMs;
  }

  /** Start capturing audio from the microphone */
  async start(): Promise<void> {
    this.stopped = false;
    this.recording = true;
    this.currentChunk = [];
    this.readyChunks = [];

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: TARGET_SAMPLE_RATE,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    this.audioContext = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });
    this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
    this.processorNode = this.audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

    this.processorNode.onaudioprocess = (event: AudioProcessingEvent) => {
      if (!this.recording) return;

      const float32 = event.inputBuffer.getChannelData(0);
      const nativeSampleRate = this.audioContext!.sampleRate;

      let samples: Float32Array;
      if (nativeSampleRate !== TARGET_SAMPLE_RATE) {
        samples = resample(float32, nativeSampleRate, TARGET_SAMPLE_RATE);
      } else {
        samples = float32;
      }

      this.currentChunk.push(float32ToInt16(samples));
    };

    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);

    // Every chunkDurationMs, finalize the current chunk and make it available
    this.chunkTimer = setInterval(() => {
      this.finalizeChunk();
    }, this.chunkDurationMs);
  }

  /** Stop recording and release resources */
  stop(): void {
    this.recording = false;

    if (this.chunkTimer) {
      clearInterval(this.chunkTimer);
      this.chunkTimer = null;
    }

    // Finalize any remaining audio
    this.finalizeChunk();

    this.stopped = true;

    this.processorNode?.disconnect();
    this.sourceNode?.disconnect();
    this.audioContext?.close();
    this.stream?.getTracks().forEach((t) => t.stop());

    this.processorNode = null;
    this.sourceNode = null;
    this.audioContext = null;
    this.stream = null;

    // Wake up consumer
    if (this.chunkReady) {
      this.chunkReady();
      this.chunkReady = null;
    }
  }

  get isRecording(): boolean {
    return this.recording;
  }

  /**
   * Async generator that yields a WAV Blob every `chunkDurationMs`.
   * Each Blob is a complete WAV file suitable for the Mistral transcription API.
   *
   * Usage:
   *   for await (const wavBlob of recorder.chunkedStream()) {
   *     const transcription = await client.audio.transcriptions.complete({
   *       model: "voxtral-mini-latest",
   *       file: new File([wavBlob], "audio.wav", { type: "audio/wav" }),
   *     });
   *     console.log(transcription.text);
   *   }
   */
  async *chunkedStream(): AsyncGenerator<Blob> {
    while (true) {
      while (this.readyChunks.length > 0) {
        yield this.readyChunks.shift()!;
      }

      if (this.stopped) break;

      await new Promise<void>((resolve) => {
        this.chunkReady = resolve;
      });
    }
  }

  /** Finalize the current chunk buffer into a WAV Blob */
  private finalizeChunk(): void {
    if (this.currentChunk.length === 0) return;

    const totalLength = this.currentChunk.reduce((s, c) => s + c.length, 0);
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of this.currentChunk) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    const wavBlob = createWavBlob(merged, TARGET_SAMPLE_RATE);
    this.readyChunks.push(wavBlob);
    this.currentChunk = [];

    if (this.chunkReady) {
      this.chunkReady();
      this.chunkReady = null;
    }
  }
}

/** Convert Float32 samples (range -1..1) to Int16 PCM S16LE as a Uint8Array */
function float32ToInt16(float32: Float32Array): Uint8Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return new Uint8Array(int16.buffer);
}

/** Simple linear resampling from one sample rate to another */
function resample(
  input: Float32Array,
  fromRate: number,
  toRate: number
): Float32Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const outputLength = Math.round(input.length / ratio);
  const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const low = Math.floor(srcIndex);
    const high = Math.min(low + 1, input.length - 1);
    const frac = srcIndex - low;
    output[i] = input[low] * (1 - frac) + input[high] * frac;
  }
  return output;
}

/** Wrap raw PCM S16LE bytes in a WAV container */
function createWavBlob(pcmData: Uint8Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const headerSize = 44;

  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);              // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // PCM data
  new Uint8Array(buffer, headerSize).set(pcmData);

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
