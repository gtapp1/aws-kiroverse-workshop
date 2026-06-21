// ============================================================
//  gates.js — Red gate + gate spawner (Impossible Mode trigger)
// ============================================================
class RedGate {
  constructor(x) {
    this.x = x; this.y = PIPE_MIN_Y + Math.random() * (PIPE_MAX_Y - PIPE_MIN_Y);
    this.w = GATE_W; this.h = GATE_H; this.active = true; this._pulse = 0;
  }
  update(dt, speedMult) {
    this.x -= PIPE_SPEED * speedMult * dt; this._pulse += dt * 4;
    if (this.x + this.w < 0) this.active = false;
  }
  getBounds() { return { x: this.x, y: this.y - this.h / 2, w: this.w, h: this.h }; }
  draw(ctx) {
    if (!this.active) return;
    const glow = 0.5 + 0.5 * Math.sin(this._pulse);
    ctx.save();
    ctx.shadowColor = `rgba(255,0,0,${0.6 + 0.4 * glow})`; ctx.shadowBlur = 18;
    const bx = this.x, by = this.y - this.h / 2, bw = this.w, bh = this.h;
    const grad = ctx.createLinearGradient(bx, by, bx + bw, by);
    grad.addColorStop(0, `rgba(255,30,30,${0.7 + 0.3 * glow})`);
    grad.addColorStop(0.5, `rgba(255,120,0,${0.5 + 0.3 * glow})`);
    grad.addColorStop(1, `rgba(255,30,30,${0.7 + 0.3 * glow})`);
    ctx.fillStyle = grad; ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = 'rgba(80,0,0,0.8)';
    ctx.fillRect(bx, by, 5, bh); ctx.fillRect(bx + bw - 5, by, 5, bh);
    ctx.fillStyle = `rgba(255,255,0,${0.3 * glow})`;
    for (let i = 0; i < 3; i++) ctx.fillRect(bx + 5, by + (bh / 4) * (i + 0.5) - 2, bw - 10, 4);
    ctx.fillStyle = `rgba(255,255,255,${0.8 + 0.2 * glow})`;
    ctx.font = 'bold 18px "Courier New", monospace'; ctx.textAlign = 'center';
    ctx.fillText('!', bx + bw / 2, by + bh / 2 + 6); ctx.textAlign = 'left';
    ctx.restore();
  }
}

class GateSpawner {
  constructor() { this.gates = []; this._dist = 0; }
  reset() { this.gates = []; this._dist = GATE_SPACING * 0.6; }
  update(dt, speedMult, diff) {
    const speed = diff ? diff.pipeSpeed * speedMult : PIPE_SPEED * speedMult;
    this._dist += speed * dt;
    for (const g of this.gates) {
      g.x -= speed * dt;
      g._pulse += dt * 4;
      if (g.x + g.w < 0) g.active = false;
    }
    this.gates = this.gates.filter(g => g.active);
    if (this._dist >= GATE_SPACING) { this.gates.push(new RedGate(CANVAS_W + 30)); this._dist = 0; }
  }
  draw(ctx) { for (const g of this.gates) g.draw(ctx); }
}
