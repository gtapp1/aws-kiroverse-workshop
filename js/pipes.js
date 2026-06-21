// ============================================================
//  pipes.js — PipePair + ObstacleSpawner
// ============================================================
class PipePair {
  constructor(x, gapCenterY) {
    this.x = x; this.gapCenterY = gapCenterY; this.scored = false;
    this._topHoleCut = 0; this._botHoleCut = 0;
  }
  get topPipeH() { return Math.max(0, this.gapCenterY - PIPE_GAP / 2 - this._topHoleCut); }
  get topPipeHFull() { return this.gapCenterY - PIPE_GAP / 2; }
  get botPipeY() { return this.gapCenterY + PIPE_GAP / 2 + this._botHoleCut; }
  get botPipeYFull() { return this.gapCenterY + PIPE_GAP / 2; }
  get botPipeH() { return Math.max(0, CANVAS_H - this.botPipeY); }

  getTopBounds() { return { x: this.x, y: 0, w: PIPE_WIDTH, h: this.topPipeHFull }; }
  getBotBounds() { return { x: this.x, y: this.botPipeYFull, w: PIPE_WIDTH, h: CANVAS_H - this.botPipeYFull }; }
  getTopBoundsModified() { return { x: this.x, y: 0, w: PIPE_WIDTH, h: this.topPipeH }; }
  getBotBoundsModified() { return { x: this.x, y: this.botPipeY, w: PIPE_WIDTH, h: this.botPipeH }; }

  update(dt, speedMult) { this.x -= PIPE_SPEED * speedMult * dt; }

  _drawSegment(ctx, px, py, pw, ph, isTop) {
    if (ph <= 0) return;
    ctx.fillStyle = '#388e3c'; ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = '#4caf50'; ctx.fillRect(px, py, 10, ph);
    ctx.fillStyle = '#1b5e20'; ctx.fillRect(px + pw - 8, py, 8, ph);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect(px, py, pw, ph);
    const capX = px - 8, capW = pw + 16, capY = isTop ? py + ph - 20 : py;
    ctx.fillStyle = '#388e3c'; ctx.fillRect(capX, capY, capW, 20);
    ctx.fillStyle = '#4caf50'; ctx.fillRect(capX, capY, 10, 20);
    ctx.fillStyle = '#1b5e20'; ctx.fillRect(capX + capW - 8, capY, 8, 20);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeRect(capX, capY, capW, 20);
    if (isTop && this._topHoleCut > 0) {
      ctx.fillStyle = '#ff8800'; ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 8;
      ctx.fillRect(px, py + ph, pw, 2); ctx.shadowBlur = 0;
    }
    if (!isTop && this._botHoleCut > 0) {
      ctx.fillStyle = '#ff8800'; ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 8;
      ctx.fillRect(px, py - 2, pw, 2); ctx.shadowBlur = 0;
    }
  }
  draw(ctx) {
    this._drawSegment(ctx, this.x, 0, PIPE_WIDTH, this.topPipeH, true);
    this._drawSegment(ctx, this.x, this.botPipeY, PIPE_WIDTH, this.botPipeH, false);
  }
}

class ObstacleSpawner {
  constructor() { this.pipes = []; }
  reset() { this.pipes = [new PipePair(CANVAS_W + 20, this._randomGapY())]; }
  _randomGapY() { return PIPE_MIN_Y + Math.random() * (PIPE_MAX_Y - PIPE_MIN_Y); }
  update(dt, speedMult) {
    for (const p of this.pipes) p.update(dt, speedMult);
    const rightmost = this.pipes.reduce((b, p) => p.x > b.x ? p : b, { x: -Infinity });
    if (rightmost.x !== -Infinity && rightmost.x <= CANVAS_W - PIPE_SPACING)
      this.pipes.push(new PipePair(CANVAS_W + 20, this._randomGapY()));
    this.pipes = this.pipes.filter(p => p.x + PIPE_WIDTH >= 0);
  }
  draw(ctx) { for (const p of this.pipes) p.draw(ctx); }
}
