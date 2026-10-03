export function stored<T>(key: string, fallback: T): T {
  try {
    return (
      JSON.parse(localStorage.getItem(`david-${key}`) || "null") ?? fallback
    );
  } catch {
    return fallback;
  }
}
export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(`david-${key}`, JSON.stringify(value));
  } catch {
    /* Private mode: preferences remain in memory. */
  }
}
/** Original synthesized instruments and a quiet twelve-note modal score. No external audio. */
export class AudioDirector {
  context?: AudioContext;
  master?: GainNode;
  muted = stored("muted", false);
  musicClock = 0;
  noteIndex = 0;
  lastEffect = 0;
  unlock() {
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.connect(this.context.destination);
      }
      void this.context.resume().catch(() => {});
      this.volume();
    } catch {
      /* Audio is optional; all game rules remain active. */
    }
  }
  volume() {
    if (this.context && this.master)
      this.master.gain.setTargetAtTime(
        this.muted ? 0 : 0.26,
        this.context.currentTime,
        0.04,
      );
  }
  toggle() {
    this.muted = !this.muted;
    save("muted", this.muted);
    this.unlock();
  }
  tone(
    freq: number,
    duration: number,
    type: OscillatorType = "sine",
    volume = 0.2,
    delay = 0,
    end?: number,
  ) {
    const c = this.context;
    if (!c || !this.master || this.muted) return;
    const o = c.createOscillator(),
      g = c.createGain(),
      t = c.currentTime + delay;
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (end) o.frequency.exponentialRampToValueAtTime(end, t + duration);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(volume, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + duration + 0.03);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  effect(name: string, kind?: string) {
    const now = this.context?.currentTime ?? 0;
    if (["hit", "shot", "mine"].includes(name) && now - this.lastEffect < 0.065)
      return;
    this.lastEffect = now;
    if (name === "delivery" || name === "convert") {
      this.tone(740, 0.16, "sine", 0.22);
      this.tone(990, 0.3, "sine", 0.15, 0.08);
    } else if (name === "recruit" || name === "build") {
      [330, 440, 660].forEach((f, i) =>
        this.tone(f, 0.25, "triangle", 0.2, i * 0.075),
      );
    } else if (name === "dismantle") {
      this.tone(480, 0.25, "triangle", 0.2, 0, 160);
    } else if (name === "mine") {
      this.tone(1100, 0.055, "triangle", 0.13, 0, 500);
    } else if (name === "shot") {
      if (kind === "arrow") this.tone(1300, 0.11, "triangle", 0.1, 0, 220);
      else if (kind === "fire") this.tone(160, 0.25, "sawtooth", 0.09, 0, 65);
      else if (kind === "magic") {
        this.tone(700, 0.32, "sine", 0.13, 0, 1500);
        this.tone(940, 0.3, "sine", 0.08);
      }
    } else if (name === "hit") {
      this.tone(100, 0.095, "triangle", 0.18, 0, 45);
    } else if (name === "door") {
      [70, 97, 123].forEach((f) => this.tone(f, 0.7, "sawtooth", 0.11, 0, 30));
    } else if (name === "win") {
      [262, 330, 392, 523, 659].forEach((f, i) =>
        this.tone(f, 0.75, "triangle", 0.22, i * 0.15),
      );
    } else if (name === "lose") {
      [311, 277, 196].forEach((f, i) =>
        this.tone(f, 0.9, "triangle", 0.19, i * 0.25),
      );
    } else this.tone(440, 0.08, "sine", 0.1);
  }
  update(dt: number) {
    if (this.muted || !this.context) return;
    this.musicClock -= dt;
    if (this.musicClock > 0) return;
    this.musicClock = 0.8;
    const notes = [
      220, 330, 392, 440, 392, 330, 293.66, 330, 261.63, 330, 392, 293.66,
    ];
    const f = notes[this.noteIndex++ % notes.length];
    this.tone(f, 1.6, "sine", 0.035);
    this.tone(f / 2, 2.4, "triangle", 0.028);
    if (this.noteIndex % 4 === 0) this.tone(f * 2, 0.5, "triangle", 0.025);
  }
}
