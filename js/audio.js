// ============================================================
//  audio.js — Web Audio API synthesizer (no external files)
// ============================================================
class AudioManager {
  constructor() {
    this._ctx = null;
    this._initialized = false;
  }

  /** Lazy-init AudioContext on first user interaction (browser policy). */
  _ensure() {
    if (this._initialized) return;
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._initialized = true;
    } catch (_) { /* Audio unavailable — silent fallback */ }
  }

  _osc(type, freq, duration, gain = 0.3, detune = 0) {
    if (!this._ctx) return;
    const o = this._ctx.createOscillator();
    const g = this._ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    g.gain.setValueAtTime(gain, this._ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + duration);
    o.connect(g).connect(this._ctx.destination);
    o.start();
    o.stop(this._ctx.currentTime + duration);
  }

  /** Synth "boop" — short bright tone on flap. */
  playFlap() {
    this._ensure();
    this._osc('sine', 520, 0.08, 0.15);
  }

  /** "Zap" — short buzzy noise on laser fire. */
  playLaser() {
    this._ensure();
    this._osc('sawtooth', 180, 0.15, 0.2);
    this._osc('square', 900, 0.08, 0.1);
  }

  /** "Waaah" descending tone on death. */
  playDeath() {
    this._ensure();
    if (!this._ctx) return;
    const o = this._ctx.createOscillator();
    const g = this._ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(440, this._ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(80, this._ctx.currentTime + 0.6);
    g.gain.setValueAtTime(0.25, this._ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + 0.6);
    o.connect(g).connect(this._ctx.destination);
    o.start();
    o.stop(this._ctx.currentTime + 0.7);
  }

  /** Dramatic chord — impossible mode activates. */
  playImpossible() {
    this._ensure();
    this._osc('square', 220, 0.4, 0.15);
    this._osc('square', 277, 0.4, 0.12);
    this._osc('square', 330, 0.4, 0.12);
  }

  /** Short sparkle — power-up collected. */
  playPowerup() {
    this._ensure();
    this._osc('sine', 880, 0.1, 0.15);
    setTimeout(() => this._osc('sine', 1100, 0.1, 0.12), 60);
    setTimeout(() => this._osc('sine', 1320, 0.15, 0.1), 120);
  }

  /** Shield break — crackle. */
  playShieldBreak() {
    this._ensure();
    this._osc('sawtooth', 300, 0.2, 0.2);
    this._osc('triangle', 150, 0.15, 0.15);
  }

  /** Score point — tiny tick. */
  playScore() {
    this._ensure();
    this._osc('sine', 660, 0.05, 0.08);
  }

  /** Combo milestone — ascending arpeggio. */
  playMilestone() {
    this._ensure();
    this._osc('sine', 523, 0.1, 0.12);
    setTimeout(() => this._osc('sine', 659, 0.1, 0.12), 80);
    setTimeout(() => this._osc('sine', 784, 0.15, 0.15), 160);
  }
}
