// ============================================================
//  particles.js — Particle system for visual juice
//  Types: ghost wisps, laser sparks, pipe debris, shield shatter
// ============================================================
class ParticleSystem {
  constructor() {
    this._particles = [];
  }

  reset() { this._particles = []; }

  /** Emit a ghost wisp trailing behind Kiro. */
  emitWisp(x, y) {
    this._particles.push({
      x, y,
      vx: -30 - Math.random() * 40,
      vy: (Math.random() - 0.5) * 30,
      life: 0.4 + Math.random() * 0.3,
      maxLife: 0.4 + Math.random() * 0.3,
      size: 3 + Math.random() * 4,
      color: 'rgba(200,200,255,',
      type: 'wisp',
    });
  }

  /** Spark burst when laser hits a pipe. */
  emitLaserSparks(x, y) {
    for (let i = 0; i < 12; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 80 + Math.random() * 200;
      this._particles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.3 + Math.random() * 0.3,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.5 ? 'rgba(255,200,0,' : 'rgba(255,80,0,',
        type: 'spark',
      });
    }
  }

  /** Debris chunks flying off a pipe hole. */
  emitDebris(x, y) {
    for (let i = 0; i < 8; i++) {
      const ang = -Math.PI / 4 + Math.random() * Math.PI / 2;
      const spd = 60 + Math.random() * 120;
      this._particles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 50,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.5 + Math.random() * 0.4,
        size: 4 + Math.random() * 5,
        color: Math.random() > 0.5 ? 'rgba(76,175,80,' : 'rgba(27,94,32,',
        type: 'debris',
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 8,
      });
    }
  }

  /** Shield shatter — golden fragments in a ring. */
  emitShieldBreak(x, y) {
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      const spd = 100 + Math.random() * 100;
      this._particles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.6 + Math.random() * 0.3,
        maxLife: 0.6 + Math.random() * 0.3,
        size: 3 + Math.random() * 4,
        color: 'rgba(255,215,0,',
        type: 'shard',
      });
    }
  }

  update(dt) {
    for (const p of this._particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.type === 'debris' || p.type === 'shard') p.vy += 300 * dt; // gravity
      if (p.rot !== undefined) p.rot += p.rotV * dt;
      p.life -= dt;
    }
    this._particles = this._particles.filter(p => p.life > 0);
  }

  draw(ctx) {
    for (const p of this._particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color + alpha.toFixed(2) + ')';
      if (p.type === 'debris') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot || 0);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
