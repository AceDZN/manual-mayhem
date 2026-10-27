/** Original local layered score. Audio is created only by start() after a gesture. */
export type AudioCue =
  | "knob"
  | "switch"
  | "cable"
  | "latch"
  | "page"
  | "settle"
  | "error"
  | "strike"
  | "reset"
  | "activate"
  | "victory";
export type AudioGains = {
  master: number;
  music: number;
  sfx: number;
  voice: number;
};
const STORAGE_KEY = "manual-mayhem-audio-v1";
const defaults: AudioGains = { master: 0.8, music: 0.75, sfx: 0.8, voice: 1 };
const cueNames: AudioCue[] = [
  "knob",
  "switch",
  "cable",
  "latch",
  "page",
  "settle",
  "error",
  "strike",
  "reset",
  "activate",
  "victory",
];
const loopNames = [
  "workshop-harmony",
  "workshop-groove",
  "workshop-glass",
  "workshop-lift",
  "workshop-ambient",
];
const aliases: Record<string, AudioCue> = {
  valve: "knob",
  toggle: "switch",
  connect: "cable",
  clip: "latch",
  manual: "page",
  gauge: "settle",
  wrong: "error",
  recover: "reset",
  success: "activate",
  module: "activate",
  win: "victory",
};
const clamp = (value: number) =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;

export class AudioEngine {
  private context?: AudioContext;
  private master?: GainNode;
  private music?: GainNode;
  private effects?: GainNode;
  private voice?: GainNode;
  private analyser?: AnalyserNode;
  private stemGains: GainNode[] = [];
  private sources: AudioBufferSourceNode[] = [];
  private shots = new Set<AudioBufferSourceNode>();
  private buffers = new Map<string, AudioBuffer>();
  private loading?: Promise<void>;
  private requestedPause = false;
  private background = false;
  private progress = 0;
  private ducked = false;
  private suspendTimer?: ReturnType<typeof setTimeout>;
  private loadError: string | null = null;
  private cueCounter = 0;
  private lastCue: string | null = null;
  private gains: AudioGains = { ...defaults };
  private readonly onVisibility = () => {
    this.background = document.hidden;
    this.applyPause();
  };
  private readonly onBlur = () => {
    this.background = true;
    this.applyPause();
  };
  private readonly onFocus = () => {
    this.background = document.hidden;
    this.applyPause();
  };

  constructor() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "null",
      ) as Partial<AudioGains> | null;
      if (saved)
        for (const key of Object.keys(defaults) as (keyof AudioGains)[]) {
          if (typeof saved[key] === "number")
            this.gains[key] = clamp(saved[key]!);
        }
    } catch {
      /* Storage may be unavailable in private browsing. */
    }
    document.addEventListener("visibilitychange", this.onVisibility);
    window.addEventListener("blur", this.onBlur);
    window.addEventListener("focus", this.onFocus);
  }

  /** Call directly from Start/Resume/Restart click or key activation. Idempotent. */
  async start(): Promise<void> {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.music = this.context.createGain();
      this.effects = this.context.createGain();
      this.voice = this.context.createGain();
      const limiter = this.context.createDynamicsCompressor();
      limiter.threshold.value = -6;
      limiter.knee.value = 9;
      limiter.ratio.value = 8;
      limiter.attack.value = 0.004;
      limiter.release.value = 0.2;
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 1024;
      this.music.connect(limiter);
      this.effects.connect(limiter);
      this.voice.connect(limiter);
      limiter.connect(this.master);
      this.master.connect(this.analyser);
      this.analyser.connect(this.context.destination);
      this.master.gain.value = 0;
      this.applyGains();
    }
    this.background = document.hidden;
    if (!this.requestedPause && !this.background) await this.context.resume();
    if (!this.loading) this.loading = this.loadAndStart();
    await this.loading;
    this.applyPause();
  }

  private async loadAndStart(): Promise<void> {
    try {
      const context = this.context!;
      const base = `${import.meta.env.BASE_URL}audio/`;
      await Promise.all(
        [...loopNames, ...cueNames].map(async (name) => {
          const file = `${name}.${loopNames.includes(name) ? "mp3" : "wav"}`;
          const response = await fetch(base + file);
          if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
          this.buffers.set(
            name,
            await context.decodeAudioData(await response.arrayBuffer()),
          );
        }),
      );
      // All stems use one transport start and the same 32-bar loop end.
      const when = context.currentTime + 0.08;
      loopNames.forEach((name, index) => {
        const source = context.createBufferSource();
        const gain = context.createGain();
        source.buffer = this.buffers.get(name)!;
        source.loop = true;
        // Source encoders retain a gapless sample count; cap to exact score length.
        source.loopStart = 0;
        source.loopEnd = index === 4 ? 160 / 9 : 640 / 9;
        source.connect(gain);
        gain.connect(this.music!);
        gain.gain.value = this.stemLevel(index);
        source.start(when);
        this.sources.push(source);
        this.stemGains.push(gain);
      });
      this.loadError = null;
    } catch (error) {
      this.loadError = String(error);
      // Do not reject game Start for optional sound; snapshot exposes the exact failure.
      console.warn("Manual Mayhem audio unavailable:", error);
    }
  }

  private stemLevel(index: number): number {
    return index === 0
      ? 0.9
      : index === 4
        ? 0.65
        : this.progress >= index
          ? 0.92
          : 0;
  }

  setProgress(modules: number): void {
    this.progress = Math.max(0, Math.min(3, Math.floor(modules)));
    this.stemGains.forEach((gain, index) =>
      this.ramp(gain.gain, this.stemLevel(index), 0.6),
    );
  }

  setPaused(paused: boolean): void {
    this.requestedPause = paused;
    this.applyPause();
  }

  private applyPause(): void {
    if (!this.context || !this.master) return;
    if (this.suspendTimer) clearTimeout(this.suspendTimer);
    const paused = this.requestedPause || this.background;
    if (paused) {
      this.ramp(this.master.gain, 0, 0.055);
      this.suspendTimer = setTimeout(() => {
        if (this.requestedPause || this.background)
          void this.context?.suspend();
      }, 100);
    } else {
      void this.context.resume().then(() => {
        if (!this.requestedPause && !this.background) this.applyGains();
      });
    }
  }

  /** 0 means mute; previous values are owned by the settings UI if it offers toggles. */
  setGains(changes: Partial<AudioGains>): void {
    for (const key of Object.keys(changes) as (keyof AudioGains)[]) {
      const value = changes[key];
      if (typeof value === "number") this.gains[key] = clamp(value);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.gains));
    } catch {
      /* optional */
    }
    this.applyGains();
  }

  /** Reading translations / optional spoken replay can duck music and ambience. */
  duck(ducked: boolean): void {
    this.ducked = ducked;
    this.applyGains();
  }

  private applyGains(): void {
    if (!this.context) return;
    if (this.master)
      this.ramp(
        this.master.gain,
        this.requestedPause || this.background ? 0 : this.gains.master,
      );
    if (this.music)
      this.ramp(this.music.gain, this.gains.music * (this.ducked ? 0.28 : 1));
    if (this.effects) this.ramp(this.effects.gain, this.gains.sfx);
    if (this.voice) this.ramp(this.voice.gain, this.gains.voice);
  }

  private ramp(param: AudioParam, value: number, time = 0.045): void {
    if (!this.context) return;
    const now = this.context.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(value, now + time);
  }

  cue(request: AudioCue | string): void {
    const name = (aliases[request] || request) as AudioCue;
    if (
      !this.context ||
      this.context.state !== "running" ||
      this.requestedPause ||
      this.background ||
      !this.effects
    )
      return;
    const buffer = this.buffers.get(name);
    if (!buffer || this.shots.size >= 10) return;
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    const pan = this.context.createStereoPanner();
    source.buffer = buffer;
    // Gentle pitch/pan variation keeps repeated tactile cues from machine-gun sameness.
    source.playbackRate.value =
      name === "victory" || name === "activate"
        ? 1
        : 0.97 + Math.random() * 0.06;
    gain.gain.value = 0.82;
    pan.pan.value = (Math.random() - 0.5) * 0.18;
    source.connect(gain);
    gain.connect(pan);
    pan.connect(this.effects);
    this.shots.add(source);
    this.lastCue = name;
    this.cueCounter++;
    source.onended = () => {
      this.shots.delete(source);
      source.disconnect();
      gain.disconnect();
      pan.disconnect();
    };
    source.start();
  }

  snapshot() {
    let rms = 0;
    if (this.analyser && this.context?.state === "running") {
      const samples = new Float32Array(this.analyser.fftSize);
      this.analyser.getFloatTimeDomainData(samples);
      rms = Math.sqrt(
        samples.reduce((sum, value) => sum + value * value, 0) / samples.length,
      );
    }
    return {
      state: this.context?.state || "not-started",
      loaded: this.buffers.size,
      error: this.loadError,
      activeLoops: this.sources.length,
      moduleStems: this.progress,
      stemLevels: this.stemGains.map((_, index) => this.stemLevel(index)),
      paused: this.requestedPause,
      background: this.background,
      ducked: this.ducked,
      gains: { ...this.gains },
      activeShots: this.shots.size,
      cueCount: this.cueCounter,
      lastCue: this.lastCue,
      rms: Math.round(rms * 1000000) / 1000000,
      transportSeconds:
        Math.round((this.context?.currentTime || 0) * 100) / 100,
      voiceAvailable: false,
    };
  }

  /** For a discarded app instance; regular Restart must reuse this instance. */
  dispose(): void {
    if (this.suspendTimer) clearTimeout(this.suspendTimer);
    document.removeEventListener("visibilitychange", this.onVisibility);
    window.removeEventListener("blur", this.onBlur);
    window.removeEventListener("focus", this.onFocus);
    this.sources.forEach((source) => source.stop());
    this.shots.forEach((source) => source.stop());
    void this.context?.close();
    this.sources = [];
    this.shots.clear();
  }
}
