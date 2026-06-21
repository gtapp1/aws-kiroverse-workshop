// ============================================================
//  particles.js — Particle system
//  Types: ghost wisps, laser sparks, pipe debris, shield shatter,
//         score-pop text, missile explosion
// ============================================================
class ParticleSystem {
  constructor() { this._particles = []; }
  reset() { this._particles = []; }

  /** Ghost wisp trailing behind Kiro. */
  emitWisp(x, y, skinColor) {
    this._particles.push({
      x, y,
      vx: -25 - Math.random() * 45,
      vy: (Math.random() - 0.5) * 28,
      life: 0.35 + Math.random() * 0.3,
      maxLife: 0.35 + Math.random() * 0.3,
      size: 3 + Math.random() * 4,
      color: skinColor || 'rgba(200,200,255,',
      isSolid: !!skinColor,
      type: 'wisp',
    });
  }

  /** Spark burst when laser hits a pipe. */
  emitLaserSparks(x, y) {
    for (let i = 0; i < 14; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 80 + Math.random() * 220;
      this._particles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.25 + Math.random() * 0.3,
        maxLife: 0.25 + Math.random() * 0.3,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.5 ? 'rgba(255,200,0,' : 'rgba(255,80,0,',
        type: 'spark',
      });
    }
  }

  /** Debris chunks flying off a pipe hole. */
  emitDebris(x, y) {
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 4 + Math.random() * Math.PI / 2;
      const spd = 60 + Math.random() * 130;
      this._particles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 55,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.5 + Math.random() * 0.4,
        size: 4 + Math.random() * 5,
        color: Math.random() > 0.5 ? 'rgba(76,175,80,' : 'rgba(27,94,32,',
        type: 'debris',
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 10,
      });
    }
  }

  /** Shield shatter — golden ring of fragments. */
  emitShieldBreak(x, y) {
    for (let i = 0; i < 18; i++) {
      const ang = (i / 18) * Math.PI * 2;
      const spd = 90 + Math.random() * 120;
      this._particles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.5 + Math.random() * 0.3,
        size: 3 + Math.random() * 4,
        color: 'rgba(255,215,0,',
        type: 'shard',
      });
    }
  }

  /**
   * Missile explosion — fiery burst on hit.
   * @param {number} x @param {number} y
   */
  emitExplosion(x, y) {
    for (let i = 0; i < 20; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 180;
      const colors = ['rgba(255,80,0,', 'rgba(255,200,0,', 'rgba(255,255,150,'];
      this._particles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.35 + Math.random() * 0.4,
        maxLife: 0.35 + Math.random() * 0.4,
        size: 4 + Math.random() * 7,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: 'spark',
      });
    }
    // Central white flash dot
    this._particles.push({
      x, y, vx: 0, vy: 0,
      life: 0.12, maxLife: 0.12,
      size: 18, color: 'rgba(255,255,255,', type: 'spark',
    });
  }

  /**
   * Floating score-pop text particle ("+N" drifting upward).
   * @param {number} x @param {number} y @param {string} text
   * @param {string} color
   */
  emitScorePop(x, y, text, color = '#ffd700') {
    this._particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 30,
      vy: -55 - Math.random() * 30,
      life: 0.85,
      maxLife: 0.85,
      size: 16,
      color,
      type: 'text',
      text,
    });
  }

  update(dt) {
    for (const p of this._particles) {
      p.x    += p.vx * dt;
      p.y    += p.vy * dt;
      if (p.type === 'debris' || p.type === 'shard') p.vy += 280 * dt;
      if (p.type === 'text')  p.vy += 30 * dt;   // slight gravity on text
      if (p.rot  !== undefined) p.rot += p.rotV * dt;
      p.life -= dt;
    }
    this._particles = this._particles.filter(p => p.life > 0);
  }

  draw(ctx) {
    for (const p of this._particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.type === 'text') {
        // Floating score / combo text
        ctx.font      = `bold ${p.size}px "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillText(p.text, p.x + 1, p.y + 1);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
        ctx.textAlign = 'left';

      } else if (p.type === 'debris') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot || 0);
        ctx.fillStyle = p.color + alpha.toFixed(2) + ')';
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);

      } else if (p.type === 'wisp' && p.isSolid) {
        // Colored wisp matching skin
        ctx.globalAlpha = alpha * 0.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

      } else {
        ctx.fillStyle = p.color + alpha.toFixed(2) + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}
