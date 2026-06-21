// ============================================================
//  missiles.js — Homing missiles (hazard at high scores)
// ============================================================
class HomingMissile {
  constructor(x, y) {
    this.x      = x;
    this.y      = y;
    this.angle  = Math.PI;       // facing left initially
    this.speed  = MISSILE_SPEED;
    this.active = true;
    this.w      = 20;
    this.h      = 8;
    this._trail = [];
  }

  update(dt, targetX, targetY) {
    if (!this.active) return;

    // Steer toward target
    const dx   = targetX - this.x;
    const dy   = targetY - this.y;
    const desired = Math.atan2(dy, dx);
    let diff   = desired - this.angle;
    // Normalize to [-PI, PI]
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    // Apply turn rate limit
    const turn = Math.sign(diff) * Math.min(Math.abs(diff), MISSILE_TURN_RATE * dt);
    this.angle += turn;

    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;

    // Trail particles (store last few positions)
    this._trail.push({ x: this.x, y: this.y, life: 0.3 });
    if (this._trail.length > 8) this._trail.shift();
    for (const t of this._trail) t.life -= dt;
    this._trail = this._trail.filter(t => t.life > 0);

    // Remove if off-screen left
    if (this.x < -40 || this.x > CANVAS_W + 100 ||
        this.y < -40 || this.y > CANVAS_H + 40) {
      this.active = false;
    }
  }

  getBounds() {
    return {
      x: this.x - this.w / 2,
      y: this.y - this.h / 2,
      w: this.w,
      h: this.h,
    };
  }

  draw(ctx) {
    if (!this.active) return;

    // Trail
    for (const t of this._trail) {
      ctx.globalAlpha = t.life * 2;
      ctx.fillStyle = '#ff4400';
      ctx.beginPath();
      ctx.arc(t.x, t.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Missile body
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Body
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    // Nose cone
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(this.w / 2, 0);
    ctx.lineTo(this.w / 2 - 6, -this.h / 2 - 2);
    ctx.lineTo(this.w / 2 - 6,  this.h / 2 + 2);
    ctx.closePath();
    ctx.fill();
    // Tail fins
    ctx.fillStyle = '#880000';
    ctx.fillRect(-this.w / 2, -this.h / 2 - 3, 5, 3);
    ctx.fillRect(-this.w / 2,  this.h / 2,     5, 3);

    ctx.restore();
  }
}

/** Spawns homing missiles after a score threshold. */
class MissileSpawner {
  constructor() {
    this.missiles = [];
    this._timer   = MISSILE_INTERVAL;
  }

  reset() {
    this.missiles = [];
    this._timer   = MISSILE_INTERVAL;
  }

  update(dt, score, kiroX, kiroY) {
    if (score < MISSILE_SPAWN_SCORE) return;

    this._timer -= dt;
    if (this._timer <= 0) {
      this._timer = MISSILE_INTERVAL;
      // Spawn from right side at a random y
      const y = 80 + Math.random() * (CANVAS_H - 160);
      this.missiles.push(new HomingMissile(CANVAS_W + 20, y));
    }

    for (const m of this.missiles) m.update(dt, kiroX, kiroY);
    this.missiles = this.missiles.filter(m => m.active);
  }

  draw(ctx) {
    for (const m of this.missiles) m.draw(ctx);
  }
}
