// ============================================================
//  laser.js — Laser beam projectile
// ============================================================
class LaserBeam {
  constructor(x, y) {
    this.x = x; this.y = y; this.active = true;
    this.w = 32; this.h = 4;
  }
  update(dt, pipes, particles) {
    if (!this.active) return;
    this.x += LASER_SPEED * dt;
    for (const pipe of pipes) {
      if (this._hitsPipe(pipe)) {
        if (this.y < pipe.gapCenterY) pipe._topHoleCut += LASER_HOLE_H;
        else pipe._botHoleCut += LASER_HOLE_H;
        if (particles) {
          particles.emitLaserSparks(this.x, this.y);
          particles.emitDebris(this.x, this.y);
        }
        this.active = false; return;
      }
    }
    if (this.x > CANVAS_W + this.w) this.active = false;
  }
  _hitsPipe(pipe) {
    const b = { x: this.x, y: this.y - this.h / 2, w: this.w, h: this.h };
    const ol = (a, r) => a.x < r.x + r.w && a.x + a.w > r.x && a.y < r.y + r.h && a.y + a.h > r.y;
    return ol(b, pipe.getTopBoundsModified()) || ol(b, pipe.getBotBoundsModified());
  }
  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 12;
    const grad = ctx.createLinearGradient(this.x, 0, this.x + this.w, 0);
    grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.3, '#ff8800'); grad.addColorStop(1, '#ff2200');
    ctx.fillStyle = grad; ctx.fillRect(this.x, this.y - this.h / 2, this.w, this.h);
    ctx.fillStyle = '#ffff88'; ctx.beginPath();
    ctx.moveTo(this.x + this.w, this.y);
    ctx.lineTo(this.x + this.w - 8, this.y - 3);
    ctx.lineTo(this.x + this.w - 8, this.y + 3);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}
