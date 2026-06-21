// ============================================================
//  powerups.js — Shield, Slow-Mo, Shrink, Grow pickups
// ============================================================

/** Base class for all floating collectible power-ups. */
class PowerUp {
  constructor(x, y, type) {
    this.x      = x;
    this.y      = y;
    this.type   = type;   // 'shield' | 'slowmo' | 'shrink' | 'grow'
    this.active = true;
    this.w      = 26;
    this.h      = 26;
    this._pulse = Math.random() * Math.PI * 2;
  }

  update(dt, speedMult) {
    this.x -= POWERUP_SPEED * speedMult * dt;
    this._pulse += dt * 4;
    if (this.x + this.w < 0) this.active = false;
  }

  getBounds() {
    return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
  }

  draw(ctx) {
    if (!this.active) return;
    const glow = 0.5 + 0.5 * Math.sin(this._pulse);
    const bx = this.x;
    const by = this.y;

    ctx.save();
    ctx.translate(bx, by);

    // Outer glow ring
    const colors = { shield: '#ffd700', slowmo: '#00ccff', shrink: '#88ff88', grow: '#ff88ff' };
    const col = colors[this.type] || '#ffffff';
    ctx.shadowColor = col;
    ctx.shadowBlur  = 8 + 6 * glow;

    // Circle body
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.7 + 0.3 * glow;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Icon text
    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'center';
    const icons = { shield: '🛡', slowmo: '⏱', shrink: '▼', grow: '▲' };
    ctx.fillText(icons[this.type] || '?', 0, 5);
    ctx.textAlign = 'left';

    ctx.restore();
  }
}

/** Manages spawning of power-ups at random intervals. */
class PowerUpSpawner {
  constructor() {
    this.pickups = [];
    this._distanceTraveled = 0;
  }

  reset() {
    this.pickups = [];
    this._distanceTraveled = 0;
  }

  update(dt, speedMult, diff) {
    const travel = (diff ? diff.pipeSpeed : PIPE_SPEED) * speedMult * dt;
    this._distanceTraveled += travel;
    for (const p of this.pickups) p.update(dt, speedMult);
    this.pickups = this.pickups.filter(p => p.active);
    if (this._distanceTraveled >= POWERUP_SPACING) {
      this._distanceTraveled = 0;
      const types = ['shield', 'slowmo', 'shrink', 'grow'];
      const type  = types[Math.floor(Math.random() * types.length)];
      const y     = PIPE_MIN_Y + Math.random() * (PIPE_MAX_Y - PIPE_MIN_Y);
      this.pickups.push(new PowerUp(CANVAS_W + 30, y, type));
    }
  }

  draw(ctx) {
    for (const p of this.pickups) p.draw(ctx);
  }
}
