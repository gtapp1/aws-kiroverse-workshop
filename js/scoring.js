// ============================================================
//  scoring.js — Combo, milestones, run history, skins
// ============================================================

/** Combo multiplier — builds when pipes are passed in quick succession. */
class ComboTracker {
  constructor() {
    this.multiplier  = 1;
    this._timeSince  = 0;   // time since last pipe passed
    this._flashTimer = 0;   // milestone flash display timer
    this._flashText  = '';
  }

  reset() {
    this.multiplier  = 1;
    this._timeSince  = 0;
    this._flashTimer = 0;
    this._flashText  = '';
  }

  /** Call when a pipe is scored. Returns actual points to add. */
  onPipeScored() {
    if (this._timeSince < COMBO_WINDOW) {
      this.multiplier = Math.min(this.multiplier + 1, COMBO_MAX);
    } else {
      this.multiplier = 1;
    }
    this._timeSince = 0;
    return this.multiplier;  // points to add this pass
  }

  /** Call every frame. */
  update(dt) {
    this._timeSince += dt;
    // Decay combo if too much time passes
    if (this._timeSince > COMBO_WINDOW && this.multiplier > 1) {
      this.multiplier = 1;
    }
    if (this._flashTimer > 0) this._flashTimer -= dt;
  }

  /** Trigger milestone flash (called externally by Game). */
  triggerMilestone(text) {
    this._flashText  = text;
    this._flashTimer = 1.5;
  }

  draw(ctx) {
    // Combo indicator (above score area) — only show when > 1×
    if (this.multiplier > 1) {
      ctx.save();
      ctx.font      = 'bold 16px "Courier New", monospace';
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillText(`COMBO ×${this.multiplier}`, CANVAS_W - 14, 66);
      ctx.fillStyle = this.multiplier >= COMBO_MAX ? '#ff44ff' : '#ffcc00';
      ctx.fillText(`COMBO ×${this.multiplier}`, CANVAS_W - 16, 64);
      ctx.textAlign = 'left';
      ctx.restore();
    }

    // Milestone flash (large center text)
    if (this._flashTimer > 0) {
      const alpha = Math.min(1, this._flashTimer / 0.5);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font      = 'bold 40px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur  = 15;
      ctx.fillText(this._flashText, CANVAS_W / 2, CANVAS_H / 2 - 40);
      ctx.textAlign = 'left';
      ctx.restore();
    }
  }
}

/** Run history — last 5 scores stored in localStorage. */
class RunHistory {
  constructor() {
    this._key = 'flappyKiroHistory';
    this.runs = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(this._key);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr.slice(0, 5);
    } catch (_) {}
    return [];
  }

  addRun(score) {
    this.runs.unshift(score);
    if (this.runs.length > 5) this.runs.pop();
    try { localStorage.setItem(this._key, JSON.stringify(this.runs)); } catch (_) {}
  }
}

/** Ghost skins — unlocked by reaching milestones. */
class SkinManager {
  constructor() {
    this._key     = 'flappyKiroSkins';
    this.unlocked = this._load();
    this.current  = this.unlocked[0] || 'default';
    this.skins    = [
      { id: 'default',  name: 'Ghost',     color: '#f0f0ff',  requirement: 0 },
      { id: 'golden',   name: 'Gold Ghost', color: '#ffd700', requirement: 20 },
      { id: 'neon',     name: 'Neon Ghost', color: '#00ff88', requirement: 50 },
      { id: 'crimson',  name: 'Crimson',    color: '#ff4466', requirement: 100 },
      { id: 'cosmic',   name: 'Cosmic',     color: '#aa88ff', requirement: 200 },
    ];
  }

  _load() {
    try {
      const raw = localStorage.getItem(this._key);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return ['default'];
  }

  _save() {
    try { localStorage.setItem(this._key, JSON.stringify(this.unlocked)); } catch (_) {}
  }

  /** Check and unlock skins based on high score. */
  checkUnlocks(highScore) {
    let newUnlock = false;
    for (const skin of this.skins) {
      if (highScore >= skin.requirement && !this.unlocked.includes(skin.id)) {
        this.unlocked.push(skin.id);
        newUnlock = true;
      }
    }
    if (newUnlock) this._save();
    return newUnlock;
  }

  /** Cycle to next unlocked skin. */
  nextSkin() {
    const idx = this.unlocked.indexOf(this.current);
    this.current = this.unlocked[(idx + 1) % this.unlocked.length];
  }

  /** Get current skin's body color. */
  getColor() {
    const s = this.skins.find(sk => sk.id === this.current);
    return s ? s.color : '#f0f0ff';
  }
}
