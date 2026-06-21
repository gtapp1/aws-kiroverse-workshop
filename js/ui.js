// ============================================================
//  ui.js — HUD, menus, game-over tab menu, power-up timers
//  Phase 2: mute button, pause notice, new-skin unlock banner
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
    this._shadow(ctx, CANVAS_W/2, 275, 'SPACE/TAP — Flap | F — Laser',   11, '#ccffcc', 'center');
    this._shadow(ctx, CANVAS_W/2, 292, 'S — Skins | Gate — Flip gravity',  11, '#ffaaaa', 'center');
    this._shadow(ctx, CANVAS_W/2, 309, 'P — Pause  | M — Mute',            11, '#aaaaff', 'center');
    this._shadow(ctx, CANVAS_W/2, 340, 'PRESS SPACE / TAP TO START', 14, '#ccffcc', 'center');

    // Skin indicator
    if (skins) {
      const sk = skins.skins.find(s => s.id === skins.current);
      if (sk) this._shadow(ctx, CANVAS_W/2, 365, `Skin: ${sk.name}`, 12, sk.color, 'center');
    }

    // Run history mini-leaderboard
    if (runHistory && runHistory.runs.length > 0) {
      this._shadow(ctx, CANVAS_W/2, 400, '— RECENT RUNS —', 11, '#aaaaaa', 'center');
      runHistory.runs.forEach((score, i) => {
        this._shadow(ctx, CANVAS_W/2, 418 + i * 16, `${i + 1}. ${score}`, 12,
          i === 0 ? '#ffd700' : '#cccccc', 'center');
      });
    }

    if (highScore > 0)
      this._shadow(ctx, CANVAS_W/2, CANVAS_H - 60, `BEST: ${highScore}`, 16, '#ffd700', 'center');
  }

  /** Mute/unmute button — bottom right corner. */
  drawMuteButton(ctx, isMuted) {
    const bx = CANVAS_W - 36, by = CANVAS_H - 36;
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle   = 'rgba(0,0,0,0.45)';
    ctx.beginPath(); ctx.roundRect(bx, by, 26, 26, 5); ctx.fill();
    ctx.font      = '14px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = isMuted ? '#ff6666' : '#aaffcc';
    ctx.fillText(isMuted ? '🔇' : '🔊', bx + 13, by + 18);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  /** Pause notice overlay. */
  drawPauseOverlay(ctx) {
    ctx.save();
    ctx.fillStyle   = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.font      = 'bold 40px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 12;
    ctx.fillText('PAUSED', CANVAS_W / 2, CANVAS_H / 2 - 16);
    ctx.shadowBlur = 0;
    ctx.font      = 'bold 14px "Courier New", monospace';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('Press P to resume', CANVAS_W / 2, CANVAS_H / 2 + 18);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  /** New skin unlock banner — slides down from top. */
  drawUnlockBanner(ctx, skinName, skinColor, timer) {
    if (timer <= 0) return;
    const alpha = Math.min(1, timer / 0.3);
    const yOff  = (1 - Math.min(1, timer / 0.4)) * -40;  // slides in from top
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = 'rgba(0,0,0,0.75)';
    ctx.fillRect(60, 70 + yOff, CANVAS_W - 120, 38);
    ctx.strokeStyle = skinColor; ctx.lineWidth = 1.5;
    ctx.strokeRect(60, 70 + yOff, CANVAS_W - 120, 38);
    ctx.font      = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = skinColor;
    ctx.fillText(`★ SKIN UNLOCKED: ${skinName.toUpperCase()} ★`, CANVAS_W / 2, 94 + yOff);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  /** Missile danger warning — top-centre, pulses red. */
  drawMissileWarning(ctx, count) {
    const pulse = 0.6 + 0.4 * Math.sin(Date.now() * 0.01);
    ctx.save();
    ctx.font      = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.globalAlpha = pulse;
    ctx.fillStyle   = 'rgba(0,0,0,0.5)';
    ctx.fillText(`\u{1F680} MISSILE${count > 1 ? ` \u00D7${count}` : ''}`, CANVAS_W / 2 + 1, 20);
    ctx.fillStyle   = '#ff4444';
    ctx.fillText(`\u{1F680} MISSILE${count > 1 ? ` \u00D7${count}` : ''}`, CANVAS_W / 2, 19);
    ctx.globalAlpha = 1;
    ctx.textAlign   = 'left';
    ctx.restore();
  }

  /** Difficulty tier badge — bottom-right of score area. */
  drawDifficultyHUD(ctx, diff) {
    const label = diff.tierLabel;
    const col   = diff.tierColor;
    this._shadow(ctx, CANVAS_W - 16, 62, label, 11, col, 'right');
  }

  drawGameOverMenu(ctx, score, highScore, combo, isNewBest, tab, stats, leaderboard, skins, kiro, skinColor) {
    // ── Panel ──
    ctx.fillStyle = 'rgba(10,10,20,0.90)';
    ctx.fillRect(30, 80, CANVAS_W - 60, 500);
    ctx.strokeStyle = '#e94560'; ctx.lineWidth = 2;
    ctx.strokeRect(30, 80, CANVAS_W - 60, 500);

    // ── Title ──
    this._shadow(ctx, CANVAS_W/2, 116, 'GAME OVER', 30, '#e94560', 'center');
    if (isNewBest)
      this._shadow(ctx, CANVAS_W/2, 136, '★ NEW BEST! ★', 13, '#ffd700', 'center');

    // ── Tabs ──
    const tabs   = ['STATS', 'SKINS', 'LEADERBOARD'];
    const tabW   = (CANVAS_W - 80) / tabs.length;
    const tabY   = 148;
    const tabH   = 24;
    tabs.forEach((name, i) => {
      const tx     = 40 + i * tabW;
      const active = tab === i;
      ctx.fillStyle = active ? '#e94560' : 'rgba(255,255,255,0.08)';
      ctx.fillRect(tx, tabY, tabW - 2, tabH);
      this._shadow(ctx, tx + tabW / 2 - 1, tabY + 16, name, 10,
        active ? '#ffffff' : '#888888', 'center');
    });

    // ── Tab content ──
    const cy = 185;  // content y start

    if (tab === 0) {
      // ── STATS tab ──
      this._shadow(ctx, CANVAS_W/2, cy,      `SCORE: ${score}`,         22, '#ffffff', 'center');
      this._shadow(ctx, CANVAS_W/2, cy + 28, `BEST: ${highScore}`,      16, '#ffd700', 'center');
      this._shadow(ctx, CANVAS_W/2, cy + 52, `MAX COMBO: \u00D7${combo}`, 13, '#ffcc00', 'center');

      // Divider
      ctx.strokeStyle = '#ffffff22'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(55, cy + 65); ctx.lineTo(CANVAS_W - 55, cy + 65); ctx.stroke();

      // Run stats grid
      if (stats) {
        const rows = [
          [`Survived`,       `${stats.survivedSeconds}s`],
          [`Gates passed`,   String(stats.gatesPassed)],
          [`Missiles evaded`,String(stats.missilesEvaded)],
          [`Lasers fired`,   String(stats.lasersFired)],
          [`Power-ups`,      String(stats.powerupsGot)],
        ];
        rows.forEach(([label, val], i) => {
          const ry = cy + 80 + i * 24;
          this._shadow(ctx, 60,           ry, label, 11, '#aaaaaa');
          this._shadow(ctx, CANVAS_W - 60, ry, val,   11, '#ffffff', 'right');
        });
      }

      // Rotating tip
      ctx.strokeStyle = '#ffffff22'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(55, cy + 210); ctx.lineTo(CANVAS_W - 55, cy + 210); ctx.stroke();
      const tips = [
        'Collect shield for a second chance!',
        'Double-tap to fire laser through pipes',
        'Combo: pass pipes quickly for ×5!',
        'Red gate = gravity flip for 10s',
        'Score 20/50/100/200 to unlock skins',
        'Missiles spawn at score 15+',
      ];
      const tip = tips[Math.floor(Date.now() / 5000) % tips.length];
      this._shadow(ctx, CANVAS_W/2, cy + 228, tip, 9, '#666666', 'center');

    } else if (tab === 1) {
      // ── SKINS tab ──
      if (skins && kiro) {
        const all = skins.skins;
        const cols = 2, rowH = 90;
        all.forEach((skin, i) => {
          const locked = !skins.unlocked.includes(skin.id);
          const col    = i % cols;
          const row    = Math.floor(i / cols);
          const sx     = 90 + col * 150;
          const sy     = cy + row * rowH;
          const active = skins.current === skin.id;

          // Kiro preview (mini ghost icon)
          ctx.save();
          ctx.translate(sx, sy + 22);
          ctx.scale(0.55, 0.55);
          if (locked) { ctx.globalAlpha = 0.25; }
          kiro.draw(ctx, false, null, skin.color);
          ctx.restore();

          // Skin name
          const nameCol = locked ? '#444444' : (active ? skin.color : '#aaaaaa');
          this._shadow(ctx, sx, sy + 50, skin.name, 11, nameCol, 'center');
          if (active)
            this._shadow(ctx, sx, sy + 65, '✓ ACTIVE', 9, skin.color, 'center');
          else if (locked)
            this._shadow(ctx, sx, sy + 65, `REQ ${skin.requirement}`, 9, '#555555', 'center');
        });

        this._shadow(ctx, CANVAS_W/2, cy + 200, 'Press S to cycle skins', 10, '#888888', 'center');
      }

    } else {
      // ── LEADERBOARD tab ──
      this._shadow(ctx, CANVAS_W/2, cy, '— TOP 5 —', 13, '#ffd700', 'center');
      if (leaderboard && leaderboard.entries.length > 0) {
        leaderboard.entries.forEach((e, i) => {
          const ry   = cy + 24 + i * 30;
          const gold = ['#ffd700','#c0c0c0','#cd7f32','#aaaaaa','#888888'][i];
          const rank = ['1ST','2ND','3RD','4TH','5TH'][i];
          this._shadow(ctx, 60,              ry, `${rank}  ${e.score}`, 13, gold);
          this._shadow(ctx, CANVAS_W - 60,   ry, e.date,                10, '#666666', 'right');
        });
      } else {
        this._shadow(ctx, CANVAS_W/2, cy + 60, 'No scores yet!', 13, '#555555', 'center');
      }
    }

    // ── Footer navigation ──
    const fy = 548;
    ctx.strokeStyle = '#ffffff15'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(40, fy - 8); ctx.lineTo(CANVAS_W - 40, fy - 8); ctx.stroke();
    this._shadow(ctx, CANVAS_W/2, fy + 6,  '[ SPACE / TAP ] Restart',    12, '#ccffcc', 'center');
    this._shadow(ctx, CANVAS_W/2, fy + 22, '[ \u2190 \u2192 ] Switch tabs',   10, '#aaaaaa', 'center');
  }
}
