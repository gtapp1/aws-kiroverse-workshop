// ============================================================
//  audio.js — Web Audio API synthesizer (no external files)
//  All sounds are generated with oscillators and gain envelopes.
// ============================================================
class AudioManager {
  constructor() {
    this._ctx         = null;
    this._initialized = false;
    this._muted       = false;
  }

  toggle() { this._muted = !this._muted; return this._muted; }
  isMuted() { return this._muted; }

  /** Lazy-init AudioContext on first user gesture (browser policy). */
  _ensure() {
    if (this._initialized) return;
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._initialized = true;
    } catch (_) { /* no audio support */ }
  }

  _osc(type, freq, duration, gain = 0.25, freqEnd = null, detune = 0) {
    if (!this._ctx || this._muted) return;
    const o = this._ctx.createOscillator();
    const g = this._ctx.createGain();
    const t = this._ctx.currentTime;
    o.type          = type;
    o.frequency.value = freq;
    if (detune) o.detune.value = detune;
    if (freqEnd !== null)
      o.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    o.connect(g).connect(this._ctx.destination);
    o.start(t);
    o.stop(t + duration + 0.01);
  }

  /** Synth "boop" on flap. */
  playFlap() {
    this._ensure();
    this._osc('sine', 500, 0.07, 0.12);
  }

  /** "Zap" on laser fire. */
  playLaser() {
    this._ensure();
    this._osc('sawtooth', 160, 0.12, 0.18, 80);
    this._osc('square',   800, 0.06, 0.08, 400);
  }

  /** "Waaah" descending death tone. */
  playDeath() {
    this._ensure();
    this._osc('sawtooth', 440, 0.65, 0.22, 75);
    this._osc('square',   220, 0.65, 0.10, 50);
  }

  /** Impact thud on collision (before shield absorbs). */
  playImpact() {
    this._ensure();
    this._osc('triangle', 100, 0.15, 0.3, 30);
  }

  /** Dramatic minor chord — impossible mode activates. */
  playImpossible() {
    this._ensure();
    this._osc('square', 220, 0.45, 0.14);
    this._osc('square', 262, 0.45, 0.11);
    this._osc('square', 330, 0.45, 0.11);
    this._osc('square', 440, 0.20, 0.08);  // octave accent
  }

  /** Sparkle arpeggio — power-up collected. */
  playPowerup() {
    this._ensure();
    this._osc('sine', 880,  0.10, 0.14);
    setTimeout(() => this._osc('sine', 1108, 0.10, 0.11), 60);
    setTimeout(() => this._osc('sine', 1320, 0.14, 0.10), 120);
  }

  /** Crackle — shield breaks. */
  playShieldBreak() {
    this._ensure();
    this._osc('sawtooth', 320, 0.18, 0.22, 80);
    this._osc('triangle', 160, 0.14, 0.16, 40);
  }

  /** Tiny tick — pipe scored. */
  playScore() {
    this._ensure();
    this._osc('sine', 660, 0.04, 0.07);
  }

  /** Ascending arpeggio — milestone reached. */
  playMilestone() {
    this._ensure();
    this._osc('sine', 523, 0.09, 0.12);
    setTimeout(() => this._osc('sine', 659, 0.09, 0.12), 80);
    setTimeout(() => this._osc('sine', 784, 0.12, 0.14), 160);
    setTimeout(() => this._osc('sine', 1047, 0.14, 0.18), 240);
  }

  /** Max combo fanfare. */
  playMaxCombo() {
    this._ensure();
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this._osc('square', f, 0.15, 0.12), i * 60);
    });
  }

  /** Warning beep when a missile is spawned. */
  playMissileWarning() {
    this._ensure();
    this._osc('square', 880, 0.08, 0.10);
    setTimeout(() => this._osc('square', 660, 0.08, 0.10), 120);
  }

  /** Explosion boom on missile impact. */
  playExplosion() {
    this._ensure();
    this._osc('sawtooth', 180, 0.25, 0.25, 40);
    this._osc('triangle', 90,  0.30, 0.30, 20);
  }

  /**
   * Slow-mo activation warp: pitch-down sweep.
   * Gives a satisfying "time slowing" audio cue.
   */
  playSlowMo() {
    this._ensure();
    this._osc('sine', 440, 0.5, 0.20, 120);
    this._osc('sine', 220, 0.5, 0.15, 80);
  }
}
