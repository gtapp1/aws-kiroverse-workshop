// ============================================================
//  ui.js — HUD, menus, game-over tab menu, power-up timers
// ============================================================
class UIRenderer {
  _shadow(ctx, x, y, text, size, color, align = 'left') {
    ctx.font = `bold ${size}px "Courier New", monospace`;
    ctx.textAlign = align;
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillText(text, x + 2, y + 2);
    ctx.fillStyle = color; ctx.fillText(text, x, y);
    ctx.textAlign = 'left';
  }

  drawScore(ctx, score) {
    this._shadow(ctx, CANVAS_W - 16, 42, `SCORE: ${score}`, 22, '#ffffff', 'right');
  }

  drawLaserHUD(ctx, cooldown) {
    const ready = cooldown <= 0;
    const bx = 14, by = CANVAS_H - 30, barW = 110, barH = 10;
    const label = ready ? '⚡ LASER READY' : `⚡ ${cooldown.toFixed(1)}s`;
    this._shadow(ctx, bx, by - 4, label, 12, ready ? '#88ffff' : '#ff8844');
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx, by + 2, barW, barH);
    const pct = ready ? 1 : 1 - cooldown / LASER_RECHARGE;
    ctx.fillStyle = ready ? '#00ffcc' : `hsl(${Math.round(pct * 120)},100%,55%)`;
    ctx.fillRect(bx, by + 2, Math.round(barW * pct), barH);
    ctx.strokeStyle = '#ffffff44'; ctx.lineWidth = 1; ctx.strokeRect(bx, by + 2, barW, barH);
    if (ready) {
      ctx.shadowColor = '#00ffcc'; ctx.shadowBlur = 10;
      ctx.strokeStyle = '#00ffcc'; ctx.strokeRect(bx, by + 2, barW, barH); ctx.shadowBlur = 0;
    }
  }

  drawImpossibleHUD(ctx, time) {
    if (time <= 0) return;
    const col = time < 3 ? '#ff4444' : '#ff88ff';
    if (time < 3 && Math.floor(time * 4) % 2 === 0) return;
    this._shadow(ctx, 14, 30, '⚠ IMPOSSIBLE', 12, col);
    this._shadow(ctx, 14, 46, `${time.toFixed(1)}s`, 16, '#ffffff');
    const cx = 115, cy = 36, r = 14, pct = time / IMPOSSIBLE_DUR;
    ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI/2, -Math.PI/2 + pct * Math.PI * 2, false);
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.shadowColor = col; ctx.shadowBlur = 8;
    ctx.stroke(); ctx.shadowBlur = 0;
  }

  drawPowerupTimers(ctx, shield, slowmo, sizeTimer, sizeType) {
    let y = CANVAS_H - 55;
    if (shield) { this._shadow(ctx, 14, y, '🛡 SHIELD', 11, '#ffd700'); y -= 16; }
    if (slowmo > 0) { this._shadow(ctx, 14, y, `⏱ SLOW ${slowmo.toFixed(1)}s`, 11, '#00ccff'); y -= 16; }
    if (sizeTimer > 0) {
      const label = sizeType === 'shrink' ? '▼ SMALL' : '▲ BIG';
      const col   = sizeType === 'shrink' ? '#88ff88' : '#ff88ff';
      this._shadow(ctx, 14, y, `${label} ${sizeTimer.toFixed(1)}s`, 11, col);
    }
  }

  drawStartMenu(ctx, highScore, runHistory, skins) {
    this._shadow(ctx, CANVAS_W/2, 170, 'FLAPPY', 52, '#f0f0ff', 'center');
    this._shadow(ctx, CANVAS_W/2, 228, 'KIRO', 52, '#a0a0ff', 'center');
    this._shadow(ctx, CANVAS_W/2, 275, 'SPACE/TAP — Flap | F — Laser', 11, '#ccffcc', 'center');
    this._shadow(ctx, CANVAS_W/2, 292, 'S — Cycle Skins | Gate — Flip', 11, '#ffaaaa', 'center');
    this._shadow(ctx, CANVAS_W/2, 325, 'PRESS SPACE / TAP TO START', 14, '#ccffcc', 'center');

    // Skin indicator
    if (skins) {
      const sk = skins.skins.find(s => s.id === skins.current);
      if (sk) this._shadow(ctx, CANVAS_W/2, 350, `Skin: ${sk.name}`, 12, sk.color, 'center');
    }

    // Run history mini-leaderboard
    if (runHistory && runHistory.runs.length > 0) {
      this._shadow(ctx, CANVAS_W/2, 390, '— RECENT RUNS —', 11, '#aaaaaa', 'center');
      runHistory.runs.forEach((score, i) => {
        this._shadow(ctx, CANVAS_W/2, 408 + i * 16, `${i + 1}. ${score}`, 12,
          i === 0 ? '#ffd700' : '#cccccc', 'center');
      });
    }

    if (highScore > 0)
      this._shadow(ctx, CANVAS_W/2, CANVAS_H - 60, `BEST: ${highScore}`, 16, '#ffd700', 'center');
  }

  /** Game-over menu tab with stats + options. */
  drawGameOverMenu(ctx, score, highScore, combo, isNewBest) {
    // Dark overlay panel
    ctx.fillStyle = 'rgba(10,10,20,0.85)';
    ctx.fillRect(40, 100, CANVAS_W - 80, 440);
    ctx.strokeStyle = '#e94560'; ctx.lineWidth = 2;
    ctx.strokeRect(40, 100, CANVAS_W - 80, 440);

    // Title
    this._shadow(ctx, CANVAS_W/2, 145, 'GAME OVER', 36, '#e94560', 'center');

    // New best indicator
    if (isNewBest) {
      this._shadow(ctx, CANVAS_W/2, 175, '★ NEW BEST! ★', 16, '#ffd700', 'center');
    }

    // Stats panel
    this._shadow(ctx, CANVAS_W/2, 215, `SCORE: ${score}`, 24, '#ffffff', 'center');
    this._shadow(ctx, CANVAS_W/2, 245, `BEST: ${highScore}`, 18, '#ffd700', 'center');
    this._shadow(ctx, CANVAS_W/2, 275, `MAX COMBO: ×${combo}`, 14, '#ffcc00', 'center');

    // Divider
    ctx.strokeStyle = '#ffffff33'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(70, 295); ctx.lineTo(CANVAS_W - 70, 295); ctx.stroke();

    // Menu options
    this._shadow(ctx, CANVAS_W/2, 330, '[ SPACE / TAP ] Restart', 14, '#ccffcc', 'center');
    this._shadow(ctx, CANVAS_W/2, 358, '[ S ] Change Skin',       14, '#88ccff', 'center');

    // Tip
    this._shadow(ctx, CANVAS_W/2, 420, '— TIPS —', 11, '#888888', 'center');
    const tips = [
      'Collect shields for a second chance!',
      'Double-tap to fire laser through pipes',
      'Combo builds when passing pipes quickly',
      'Red gates flip your gravity for 10s',
      'Shrink potion = easier dodge, Grow = wider laser',
    ];
    const tip = tips[Math.floor(Date.now() / 5000) % tips.length];
    this._shadow(ctx, CANVAS_W/2, 445, tip, 10, '#aaaaaa', 'center');

    // Unlocked skins section
    this._shadow(ctx, CANVAS_W/2, 490, 'Score 20/50/100/200 to unlock skins!', 9, '#666666', 'center');
    this._shadow(ctx, CANVAS_W/2, 520, 'PRESS SPACE / TAP TO CONTINUE', 12, '#ffffff', 'center');
  }
}
