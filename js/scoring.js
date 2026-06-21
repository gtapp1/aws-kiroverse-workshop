// ============================================================
//  scoring.js — Combo, milestones, run history, skins
// ============================================================

/** Combo multiplier — builds on rapid successive pipe passes. */
class ComboTracker {
  constructor() {
    this.multiplier  = 1;
    this._timeSince  = 0;
    this._flashTimer = 0;
    this._flashText  = '';
    this._flashColor = '#ffd700';
  }

  reset() {
    this.multiplier  = 1;
    this._timeSince  = 0;
    this._flashTimer = 0;
    this._flashText  = '';
  }

  /** Call when a pipe is scored. Returns points to add. */
  onPipeScored() {
    if (this._timeSince < COMBO_WINDOW) {
      this.multiplier = Math.min(this.multiplier + 1, COMBO_MAX);
    } else {
      this.multiplier = 1;
    }
    this._timeSince = 0;
    return this.multiplier;
  }

  update(dt) {
    this._timeSince += dt;
    if (this._timeSince > COMBO_WINDOW && this.multiplier > 1) this.multiplier = 1;
    if (this._flashTimer > 0) this._flashTimer -= dt;
  }

  triggerMilestone(text, color = '#ffd700') {
    this._flashText  = text;
    this._flashColor = color;
    this._flashTimer = 1.6;
  }

  draw(ctx) {
    // Combo badge — only when multiplier > 1
    if (this.multiplier > 1) {
      // Color gradient: yellow → orange → magenta at COMBO_MAX
      const t    = (this.multiplier - 1) / (COMBO_MAX - 1);
      const r    = Math.round(255);
      const g    = Math.round(204 - t * 180);
      const b    = Math.round(t * 220);
      const col  = `rgb(${r},${g},${b})`;
      const size = 14 + this.multiplier;
      ctx.save();
      ctx.font      = `bold ${size}px "Courier New", monospace`;
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillText(`COMBO ×${this.multiplier}`, CANVAS_W - 14, 66);
      ctx.fillStyle = col;
      ctx.shadowColor = col; ctx.shadowBlur = 8;
      ctx.fillText(`COMBO ×${this.multiplier}`, CANVAS_W - 16, 64);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
      ctx.restore();
    }

    // Milestone flash
    if (this._flashTimer > 0) {
      const progress = this._flashTimer / 1.6;
      const alpha    = Math.min(1, progress * 2);
      const scale    = 0.7 + 0.3 * Math.sin(progress * Math.PI);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(CANVAS_W / 2, CANVAS_H / 2 - 50);
      ctx.scale(scale, scale);
      ctx.font      = 'bold 42px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillText(this._flashText, 2, 2);
      ctx.fillStyle   = this._flashColor;
      ctx.shadowColor = this._flashColor;
      ctx.shadowBlur  = 18;
      ctx.fillText(this._flashText, 0, 0);
      ctx.shadowBlur  = 0;
      ctx.textAlign   = 'left';
      ctx.restore();
    }
  }
}

/** Run history — last 5 scores in localStorage. */
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
      return Array.isArray(arr) ? arr.slice(0, 5) : [];
    } catch (_) { return []; }
  }
  addRun(score) {
    this.runs.unshift(score);
    if (this.runs.length > 5) this.runs.pop();
    try { localStorage.setItem(this._key, JSON.stringify(this.runs)); } catch (_) {}
  }
}

// ── Difficulty manager ────────────────────────────────────────
class DifficultyManager {
  constructor() { this.score = 0; }
  setScore(score) { this.score = score; }
  get pipeSpeed() { return Math.min(DIFF_SPEED_START + this.score * DIFF_SPEED_RATE, DIFF_SPEED_MAX); }
  get gapSize()   { return Math.max(DIFF_GAP_START   - this.score * DIFF_GAP_SHRINK, DIFF_GAP_MIN);  }
  get fraction()  { return Math.min(this.score / 80, 1); }
  get tierLabel() {
    const f = this.fraction;
    if (f < 0.25) return 'EASY';
    if (f < 0.50) return 'MEDIUM';
    if (f < 0.75) return 'HARD';
    return 'EXTREME';
  }
  get tierColor() {
    const f = this.fraction;
    if (f < 0.25) return '#88ff88';
    if (f < 0.50) return '#ffdd44';
    if (f < 0.75) return '#ff8844';
    return '#ff2244';
  }
}

// ── Per-run stats tracker ──────────────────────────────────
class RunStats {
  constructor() { this.reset(); }
  reset() {
    this.gatesPassed    = 0;
    this.missilesEvaded = 0;
    this.lasersFired    = 0;
    this.powerupsGot    = 0;
    this.peakCombo      = 1;
    this.startTime      = Date.now();
  }
  get survivedSeconds() { return Math.round((Date.now() - this.startTime) / 1000); }
}

// ── All-time leaderboard (top 5) ──────────────────────────
class Leaderboard {
  constructor() {
    this._key    = 'flappyKiroLeaderboard';
    this.entries = this._load();
  }
  _load() {
    try {
      const raw = localStorage.getItem(this._key);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.slice(0, 5) : [];
    } catch (_) { return []; }
  }
  _save() { try { localStorage.setItem(this._key, JSON.stringify(this.entries)); } catch (_) {} }
  submit(score) {
    if (score <= 0) return false;
    const entry = { score, date: new Date().toLocaleDateString() };
    this.entries.push(entry);
    this.entries.sort((a, b) => b.score - a.score);
    if (this.entries.length > 5) this.entries = this.entries.slice(0, 5);
    this._save();
    return this.entries[0] === entry;
  }
}

// ── Animated score display ────────────────────────────────
class AnimatedScore {
  constructor() { this._displayed = 0; this._target = 0; }
  reset() { this._displayed = 0; this._target = 0; }
  setTarget(v) { this._target = v; }
  update(dt) {
    if (this._displayed < this._target) {
      const delta = Math.max(1, Math.ceil((this._target - this._displayed) * 8 * dt));
      this._displayed = Math.min(this._displayed + delta, this._target);
    }
  }
  get value() { return Math.round(this._displayed); }
}

/** Ghost skins — unlocked by reaching score thresholds. */
class SkinManager {
  constructor() {
    this._key     = 'flappyKiroSkins';
    this.unlocked = this._load();
    this.current  = this.unlocked[0] || 'default';
    this.skins    = [
      { id: 'default', name: 'Ghost',      color: '#f0f0ff', requirement: 0   },
      { id: 'golden',  name: 'Gold Ghost', color: '#ffd700', requirement: 20  },
      { id: 'neon',    name: 'Neon Ghost', color: '#00ff88', requirement: 50  },
      { id: 'crimson', name: 'Crimson',    color: '#ff4466', requirement: 100 },
      { id: 'cosmic',  name: 'Cosmic',     color: '#aa88ff', requirement: 200 },
    ];
  }
  _load() {
    try { const r = localStorage.getItem(this._key); return r ? JSON.parse(r) : ['default']; }
    catch (_) { return ['default']; }
  }
  _save() { try { localStorage.setItem(this._key, JSON.stringify(this.unlocked)); } catch (_) {} }

  checkUnlocks(highScore) {
    let changed = false;
    for (const s of this.skins) {
      if (highScore >= s.requirement && !this.unlocked.includes(s.id)) {
        this.unlocked.push(s.id); changed = true;
      }
    }
    if (changed) this._save();
    return changed;
  }

  nextSkin() {
    const idx = this.unlocked.indexOf(this.current);
    this.current = this.unlocked[(idx + 1) % this.unlocked.length];
  }

  getColor() {
    const s = this.skins.find(sk => sk.id === this.current);
    return s ? s.color : '#f0f0ff';
  }

  getCurrentSkin() {
    return this.skins.find(sk => sk.id === this.current) || this.skins[0];
  }
}
