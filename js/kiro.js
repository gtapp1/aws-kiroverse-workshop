// ============================================================
//  kiro.js — Player character (Kiro the ghost)
//  Phase 2: eye blink animation, invincibility flicker,
//           skin-tinted ghost body, trail emission timing
// ============================================================
class Kiro {
  constructor() {
    this.x = 120; this.y = CANVAS_H / 2;
    this.w = 40;  this.h = 48;
    this.baseW = 40; this.baseH = 48;
    this.vy   = 0;
    this.time = 0;          // elapsed time for tail + blink animation
    this._sizeScale  = 1;
    this._blinkTimer = 0;   // counts down to 0 then triggers blink
    this._blinking   = 0;   // eye-closed duration remaining
    this._invincible = 0;   // flicker duration after shield absorb
  }

  reset() {
    this.x = 120; this.y = CANVAS_H / 2;
    this.vy = 0; this.time = 0;
    this._sizeScale  = 1;
    this.w = this.baseW; this.h = this.baseH;
    this._blinkTimer = 2 + Math.random() * 2;
    this._blinking   = 0;
    this._invincible = 0;
  }

  setScale(scale) {
    this._sizeScale = scale;
    this.w = this.baseW * scale;
    this.h = this.baseH * scale;
  }

  /** Trigger a post-shield invincibility flicker. */
  triggerInvincible(duration = 0.7) { this._invincible = duration; }

  flap(gravityFlipped) {
    this.vy = gravityFlipped ? Math.abs(FLAP_VEL) : FLAP_VEL;
  }

  update(dt, gravityFlipped) {
    this.time += dt;
    const g = gravityFlipped ? -GRAVITY : GRAVITY;
    this.vy += g * dt;
    if (gravityFlipped) { this.vy = Math.max(this.vy, -TERMINAL_VEL); }
    else                { this.vy = Math.min(this.vy,  TERMINAL_VEL); }
    this.y += this.vy * dt;

    // Blink logic
    this._blinkTimer -= dt;
    if (this._blinkTimer <= 0) {
      this._blinking   = 0.1;
      this._blinkTimer = 2.5 + Math.random() * 3;
    }
    if (this._blinking > 0) this._blinking -= dt;

    if (this._invincible > 0) this._invincible -= dt;
  }

  getBounds() {
    return {
      x: this.x - this.w / 2 + HIT_INSET,
      y: this.y - this.h / 2 + HIT_INSET,
      w: this.w - HIT_INSET * 2,
      h: this.h - HIT_INSET * 2,
    };
  }

  /** Returns false during invincibility flicker frames (every other 0.05s block). */
  isVisible() {
    if (this._invincible <= 0) return true;
    return Math.floor(this._invincible / 0.07) % 2 === 0;
  }

  draw(ctx, gravityFlipped, squash, skinColor) {
    if (!this.isVisible()) return;   // flicker when invincible

    ctx.save();
    ctx.translate(this.x, this.y);
    if (gravityFlipped) ctx.scale(1, -1);
    if (squash)         ctx.scale(squash.scaleX, squash.scaleY);

    // Tilt
    const maxAngle = this.vy < 0 ? 20 * Math.PI / 180 : 30 * Math.PI / 180;
    const tiltT    = Math.min(Math.abs(this.vy) / TERMINAL_VEL, 1);
    ctx.rotate((this.vy < 0 ? -1 : 1) * tiltT * maxAngle);

    const w = this.w, h = this.h;
    const bodyColor = skinColor || '#f0f0ff';

    // ── Ghost body ───────────────────────────────────────────
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, -h * 0.15, w * 0.5, Math.PI, 0, false);
    ctx.lineTo(w * 0.5, h * 0.35);
    const t = this.time * 6, bump = 8, tailY = h * 0.35;
    ctx.quadraticCurveTo( w * 0.33, tailY + bump * Math.sin(t),         w * 0.16, tailY);
    ctx.quadraticCurveTo( w * 0.0,  tailY + bump * Math.sin(t + 1.2),  -w * 0.16, tailY);
    ctx.quadraticCurveTo(-w * 0.33, tailY + bump * Math.sin(t + 2.4),  -w * 0.5,  tailY);
    ctx.lineTo(-w * 0.5, -h * 0.15);
    ctx.closePath();
    ctx.fill();

    // Body outline
    ctx.strokeStyle = 'rgba(120,120,180,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();

    // Inner sheen
    const sheen = ctx.createRadialGradient(-w * 0.1, -h * 0.22, 2, 0, 0, w * 0.6);
    sheen.addColorStop(0, 'rgba(255,255,255,0.4)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.beginPath();
    ctx.arc(0, -h * 0.15, w * 0.5, Math.PI, 0, false);
    ctx.lineTo(w * 0.5, h * 0.35); ctx.lineTo(-w * 0.5, h * 0.35);
    ctx.closePath(); ctx.fill();

    // ── Eyes ─────────────────────────────────────────────────
    const eyeY  = -h * 0.12;
    const eyeR  = 7  * this._sizeScale;
    const eyeOX = 10 * this._sizeScale;
    const isBlinking = this._blinking > 0;

    ctx.fillStyle = '#111122';
    ctx.beginPath(); ctx.arc(-eyeOX, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( eyeOX, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();

    if (isBlinking) {
      // Draw closed-eye line over each eye
      ctx.strokeStyle = bodyColor;
      ctx.lineWidth   = eyeR * 1.4;
      ctx.lineCap     = 'round';
      ctx.beginPath(); ctx.moveTo(-eyeOX - eyeR * 0.6, eyeY); ctx.lineTo(-eyeOX + eyeR * 0.6, eyeY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo( eyeOX - eyeR * 0.6, eyeY); ctx.lineTo( eyeOX + eyeR * 0.6, eyeY); ctx.stroke();
    } else {
      // Normal open eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(-eyeOX + 2, eyeY - 2, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc( eyeOX + 2, eyeY - 2, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7070ff';
      ctx.fillRect(-eyeOX - 1.5, eyeY - 1.5, 3, 3);
      ctx.fillRect( eyeOX - 1.5, eyeY - 1.5, 3, 3);
    }

    ctx.restore();
  }
}
