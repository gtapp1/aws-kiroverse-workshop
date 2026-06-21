// ============================================================
//  background.js — Sky gradient, clouds, pine forest
// ============================================================
class CloudLayer {
  constructor() {
    this._layers = [
      { speed: 18, alpha: 0.12, minY: 30, maxY: 120, minW: 80, maxW: 140, seed: 1 },
      { speed: 32, alpha: 0.20, minY: 50, maxY: 160, minW: 55, maxW: 100, seed: 2 },
      { speed: 55, alpha: 0.30, minY: 60, maxY: 200, minW: 36, maxW: 70,  seed: 3 },
    ];
    this._clouds = [];
    this._init();
  }
  _rng(seed) {
    let s = seed | 0;
    return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
  }
  _init() {
    this._clouds = [];
    this._layers.forEach((layer, li) => {
      const rng = this._rng(layer.seed * 7919);
      for (let i = 0; i < 7; i++) {
        const w = layer.minW + rng() * (layer.maxW - layer.minW);
        const y = layer.minY + rng() * (layer.maxY - layer.minY);
        this._clouds.push({ x: rng() * CANVAS_W, y, w, h: w * 0.45, layerIdx: li, alpha: layer.alpha });
      }
    });
  }
  reset() { this._init(); }
  update(dt, state) {
    if (state !== STATE.PLAYING) return;
    this._layers.forEach((layer, li) => {
      this._clouds.filter(c => c.layerIdx === li).forEach(c => {
        c.x -= layer.speed * dt;
        if (c.x + c.w < 0) {
          const rng = this._rng((Date.now() + c.y * 31 + li * 997) | 0);
          c.y = layer.minY + rng() * (layer.maxY - layer.minY);
          c.x = CANVAS_W + rng() * 60;
        }
      });
    });
  }
  draw(ctx) {
    ctx.save();
    for (let li = 0; li < this._layers.length; li++) {
      this._clouds.filter(c => c.layerIdx === li).forEach(c => {
        ctx.globalAlpha = c.alpha;
        ctx.fillStyle = '#d0e8ff';
        const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
        const rx = c.w / 2, ry = c.h / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx * 0.65, ry, 0, 0, Math.PI * 2);
        ctx.ellipse(cx - rx * 0.4, cy - ry * 0.3, rx * 0.45, ry * 0.7, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + rx * 0.4, cy - ry * 0.2, rx * 0.40, ry * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

class BackgroundRenderer {
  constructor() {
    this.stripW = CANVAS_W * 2; this.stripH = 160; this.treeOff = 0;
    this._buildTreeStrip();
  }
  _buildTreeStrip() {
    this.treeCanvas = document.createElement('canvas');
    this.treeCanvas.width = this.stripW; this.treeCanvas.height = this.stripH;
    const tc = this.treeCanvas.getContext('2d');
    tc.fillStyle = '#0d2b0d'; tc.fillRect(0, 0, this.stripW, this.stripH);
    const rng = this._rng(42); let x = 0;
    while (x < this.stripW + 80) {
      const h = 60 + rng() * 80, baseW = 22 + rng() * 18;
      this._drawPine(tc, x, this.stripH, h, baseW);
      x += baseW * 0.9 + rng() * 20;
    }
  }
  _rng(seed) {
    let s = seed;
    return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
  }
  _drawPine(tc, x, groundY, height, baseW) {
    tc.fillStyle = '#1a4a1a';
    for (let i = 0; i < 4; i++) {
      const layerH = height * 0.45, ly = groundY - height + i * (height * 0.22);
      const lw = baseW * (1 - i * 0.18);
      tc.beginPath(); tc.moveTo(x, ly + layerH); tc.lineTo(x - lw, ly + layerH);
      tc.lineTo(x - lw * 0.5, ly); tc.closePath(); tc.fill();
      tc.fillStyle = '#2a6a2a'; tc.beginPath();
      tc.moveTo(x - lw * 0.5, ly); tc.lineTo(x - lw * 0.75, ly + layerH * 0.5);
      tc.lineTo(x - lw * 0.5, ly + layerH * 0.4); tc.closePath(); tc.fill();
      tc.fillStyle = '#1a4a1a';
    }
  }
  resetScroll() { this.treeOff = 0; }
  update(dt, state) {
    if (state === STATE.PLAYING) this.treeOff = (this.treeOff + TREE_SPEED * dt) % CANVAS_W;
  }
  draw(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, '#1a0a2e'); grad.addColorStop(0.35, '#0d1b4a');
    grad.addColorStop(0.7, '#0a2a2a'); grad.addColorStop(1, '#061a06');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = 'rgba(255,255,220,0.75)';
    [[40,40],[120,25],[200,60],[310,30],[420,15],[80,90],[260,80],[380,55],[450,90],[160,110],[340,100]]
      .forEach(([sx, sy]) => ctx.fillRect(sx, sy, 2, 2));
    const ty = CANVAS_H - this.stripH;
    ctx.drawImage(this.treeCanvas, -this.treeOff, ty, CANVAS_W, this.stripH);
    ctx.drawImage(this.treeCanvas, CANVAS_W - this.treeOff, ty, CANVAS_W, this.stripH);
  }
}
