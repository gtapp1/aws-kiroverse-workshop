// ============================================================
//  crt.js — CRT overlay (scanlines + vignette)
// ============================================================
class CRTOverlay {
  constructor() {
    this._scanlines = document.createElement('canvas');
    this._scanlines.width = 1; this._scanlines.height = CANVAS_H;
    const sc = this._scanlines.getContext('2d');
    for (let y = 0; y < CANVAS_H; y += 2) {
      sc.fillStyle = 'rgba(0,0,0,0.10)'; sc.fillRect(0, y, 1, 1);
    }
  }
  draw(ctx) {
    const pat = ctx.createPattern(this._scanlines, 'repeat-x');
    ctx.save(); ctx.fillStyle = pat; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H); ctx.restore();
    const vgr = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/2, CANVAS_H*0.3, CANVAS_W/2, CANVAS_H/2, CANVAS_H*0.9);
    vgr.addColorStop(0, 'rgba(0,0,0,0)'); vgr.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vgr; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
}
