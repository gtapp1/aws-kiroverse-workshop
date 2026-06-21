// ============================================================
//  background.js — Sky gradient (day/night cycle), twinkling
//                  stars, semi-transparent parallax clouds,
//                  and pine-forest silhouette
// ============================================================

// Sky palette keyframes — interpolated over score milestones
const SKY_PALETTES = [
  // score 0 — twilight purple
  { stops: ['#1a0a2e','#0d1b4a','#0a2a2a','#061a06'] },
  // score 20 — deeper midnight
  { stops: ['#05001a','#060b2a','#040f18','#020a02'] },
  // score 40 — dawn orange bleed
  { stops: ['#1a0a1a','#2a1428','#1a1020','#0a1a0a'] },
  // score 60 — sunrise
  { stops: ['#2a0820','#3a1838','#1a1428','#0a1010'] },
  // score 80+ — deep crimson night
  { stops: ['#1a0010','#0a0022','#180030','#050010'] },
];

class CloudLayer {
  constructor() {
    this._layers = [
      { speed: 18, alpha: 0.11, minY: 30, maxY: 110, minW: 80, maxW: 140, seed: 1 },
      { speed: 33, alpha: 0.19, minY: 50, maxY: 160, minW: 55, maxW: 100, seed: 2 },
      { speed: 58, alpha: 0.28, minY: 60, maxY: 200, minW: 36, maxW:  70, seed: 3 },
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
        this._clouds.push({ x: rng() * CANVAS_W, y, w, h: w * 0.42, layerIdx: li, alpha: layer.alpha });
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
          const rng = this._rng((Date.now() * 0.01 + c.y * 31 + li * 997) | 0);
          c.y = layer.minY + rng() * (layer.maxY - layer.minY);
          c.x = CANVAS_W + 10 + rng() * 80;
        }
      });
    });
  }
  draw(ctx) {
    ctx.save();
    for (let li = 0; li < this._layers.length; li++) {
      this._clouds.filter(c => c.layerIdx === li).forEach(c => {
        ctx.globalAlpha = c.alpha;
        ctx.fillStyle   = '#d0e8ff';
        const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
        const rx = c.w / 2, ry = c.h / 2;
        ctx.beginPath();
        ctx.ellipse(cx,             cy,           rx * 0.65, ry,         0, 0, Math.PI * 2);
        ctx.ellipse(cx - rx * 0.40, cy - ry * 0.3, rx * 0.45, ry * 0.70, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + rx * 0.42, cy - ry * 0.2, rx * 0.40, ry * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

class BackgroundRenderer {
  constructor() {
    this.stripW   = CANVAS_W * 2;
    this.stripH   = 160;
    this.treeOff  = 0;
    this._palette = 0;        // current palette index (0–4)
    this._palBlend = 0;       // 0–1 blend toward next palette
    this._stars   = this._genStars();
    this._buildTreeStrip();
  }

  _genStars() {
    // 22 stars with individual twinkle offsets
    return Array.from({ length: 22 }, () => ({
      x: Math.random() * CANVAS_W,
      y: 10 + Math.random() * 160,
      size: Math.random() > 0.7 ? 2 : 1,
      phase: Math.random() * Math.PI * 2,
      speed: 2 + Math.random() * 3,
    }));
  }

  _buildTreeStrip() {
    this.treeCanvas        = document.createElement('canvas');
    this.treeCanvas.width  = this.stripW;
    this.treeCanvas.height = this.stripH;
    const tc = this.treeCanvas.getContext('2d');
    tc.fillStyle = '#0d2b0d';
    tc.fillRect(0, 0, this.stripW, this.stripH);
    const rng = this._rng(42);
    let x = 0;
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
      const layerH = height * 0.45;
      const ly = groundY - height + i * (height * 0.22);
      const lw = baseW * (1 - i * 0.18);
      tc.beginPath();
      tc.moveTo(x, ly + layerH); tc.lineTo(x - lw, ly + layerH);
      tc.lineTo(x - lw * 0.5, ly); tc.closePath(); tc.fill();
      tc.fillStyle = '#2a6a2a'; tc.beginPath();
      tc.moveTo(x - lw * 0.5, ly); tc.lineTo(x - lw * 0.75, ly + layerH * 0.5);
      tc.lineTo(x - lw * 0.5, ly + layerH * 0.4); tc.closePath(); tc.fill();
      tc.fillStyle = '#1a4a1a';
    }
  }

  resetScroll() { this.treeOff = 0; }

  /** Advance palette toward the one matching the current score. */
  updatePalette(score) {
    const targetIdx = Math.min(Math.floor(score / 20), SKY_PALETTES.length - 1);
    if (this._palette !== targetIdx) this._palette = targetIdx;
  }

  update(dt, state) {
    if (state === STATE.PLAYING)
      this.treeOff = (this.treeOff + TREE_SPEED * dt) % CANVAS_W;
  }

  draw(ctx, score = 0) {
    // Choose sky palette
    this.updatePalette(score);
    const pal = SKY_PALETTES[this._palette].stops;

    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0,    pal[0]);
    grad.addColorStop(0.35, pal[1]);
    grad.addColorStop(0.70, pal[2]);
    grad.addColorStop(1,    pal[3]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Twinkling stars
    const now = Date.now() * 0.001;
    for (const star of this._stars) {
      const twinkle = 0.45 + 0.55 * Math.abs(Math.sin(now * star.speed + star.phase));
      ctx.globalAlpha = twinkle * 0.85;
      ctx.fillStyle   = 'rgba(255,255,210,1)';
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1;

    // Pine silhouette
    const ty = CANVAS_H - this.stripH;
    ctx.drawImage(this.treeCanvas, -this.treeOff,           ty, CANVAS_W, this.stripH);
    ctx.drawImage(this.treeCanvas, CANVAS_W - this.treeOff, ty, CANVAS_W, this.stripH);
  }
}
