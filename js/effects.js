// ============================================================
//  effects.js — Screen shake, squash/stretch, color flash,
//               slow-mo vignette, impossible-mode tint
// ============================================================

class ScreenShake {
  constructor() {
    this._time      = 0;
    this._maxTime   = 0;
    this._intensity = 0;
    this.offsetX    = 0;
    this.offsetY    = 0;
  }

  /** Trigger a shake. Stacks intensity; resets timer to longest. */
  trigger(intensity = SHAKE_INTENSITY, duration = SHAKE_DURATION) {
    if (duration > this._time) { this._time = duration; this._maxTime = duration; }
    this._intensity = Math.max(this._intensity, intensity);
  }

  update(dt) {
    if (this._time <= 0) {
      this.offsetX = 0; this.offsetY = 0; this._intensity = 0;
      return;
    }
    this._time -= dt;
    // Ease-out: shake decays as time approaches zero
    const decay = this._maxTime > 0 ? this._time / this._maxTime : 0;
    this.offsetX = (Math.random() - 0.5) * 2 * this._intensity * decay;
    this.offsetY = (Math.random() - 0.5) * 2 * this._intensity * decay;
  }
}

// ── Squash / stretch on flap ──────────────────────────────
class SquashStretch {
  constructor() {
    this.scaleX = 1;
    this.scaleY = 1;
    this._time  = 0;
    this._dur   = 0.18;
  }

  triggerFlap() { this._time = this._dur; }

  update(dt) {
    if (this._time <= 0) { this.scaleX = 1; this.scaleY = 1; return; }
    this._time -= dt;
    const t = 1 - (this._time / this._dur);        // 0 → 1 over duration
    const s = Math.sin(t * Math.PI);
    this.scaleX = 1 + 0.28 * s;                    // wide briefly
    this.scaleY = 1 - 0.22 * s;                    // short briefly
  }
}

// ── Full-canvas color flash (red on death, white on collect) ─
class ColorFlash {
  constructor() { this._time = 0; this._dur = 0; this._color = '#ffffff'; }

  trigger(color = '#ffffff', duration = 0.12) {
    this._color = color; this._time = duration; this._dur = duration;
  }

  update(dt) { if (this._time > 0) this._time -= dt; }

  draw(ctx) {
    if (this._time <= 0) return;
    const alpha = (this._time / this._dur) * 0.35;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = this._color;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();
  }
}

// ── Impossible-mode red tint overlay ──────────────────────
class ImpossibleOverlay {
  /** Draw a pulsing red tint while impossible mode is active. */
  draw(ctx, impossibleTime) {
    if (impossibleTime <= 0) return;
    const pulse = 0.04 + 0.03 * Math.sin(Date.now() * 0.008);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle   = '#ff0033';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();
  }
}

// ── Slow-motion blue vignette ─────────────────────────────
class SlowMoOverlay {
  /** Draw a cool blue vignette ring while slow-mo is active. */
  draw(ctx, slowmoTime) {
    if (slowmoTime <= 0) return;
    const alpha = Math.min(slowmoTime / SLOWMO_DURATION, 1) * 0.18;
    const vgr = ctx.createRadialGradient(
      CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.2,
      CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.8
    );
    vgr.addColorStop(0, 'rgba(0,150,255,0)');
    vgr.addColorStop(1, `rgba(0,80,200,${alpha.toFixed(3)})`);
    ctx.save();
    ctx.fillStyle = vgr;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();
  }
}
