// ============================================================
//  effects.js — Screen shake + squash/stretch for Kiro
// ============================================================
class ScreenShake {
  constructor() {
    this._time      = 0;
    this._intensity = 0;
    this.offsetX    = 0;
    this.offsetY    = 0;
  }

  /** Trigger a shake (stacks with existing shake). */
  trigger(intensity = SHAKE_INTENSITY, duration = SHAKE_DURATION) {
    this._time      = duration;
    this._intensity = Math.max(this._intensity, intensity);
  }

  update(dt) {
    if (this._time <= 0) {
      this.offsetX = 0;
      this.offsetY = 0;
      this._intensity = 0;
      return;
    }
    this._time -= dt;
    const decay = this._time / SHAKE_DURATION;
    this.offsetX = (Math.random() - 0.5) * 2 * this._intensity * decay;
    this.offsetY = (Math.random() - 0.5) * 2 * this._intensity * decay;
  }
}

/** Squash/stretch state for Kiro's flap animation. */
class SquashStretch {
  constructor() {
    this.scaleX = 1;
    this.scaleY = 1;
    this._time  = 0;
  }

  /** Trigger a squash (wide + short) that bounces to normal. */
  triggerFlap() {
    this._time = 0.15;
  }

  update(dt) {
    if (this._time <= 0) {
      this.scaleX = 1;
      this.scaleY = 1;
      return;
    }
    this._time -= dt;
    const t = 1 - (this._time / 0.15);  // 0→1 over duration
    // Squash then spring back
    this.scaleX = 1 + 0.25 * Math.sin(t * Math.PI);
    this.scaleY = 1 - 0.20 * Math.sin(t * Math.PI);
  }
}
