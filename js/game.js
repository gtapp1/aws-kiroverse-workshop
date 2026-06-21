// ============================================================
//  game.js — Main Game class (FSM + loop + wiring)
//  Phase 2: pause, mute, score-pop particles, explosion on
//           missile impact, skin-unlock banner, bg sky cycle,
//           slow-mo audio, invincibility flicker after shield
// ============================================================
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx    = this.canvas.getContext('2d');

    this.state  = STATE.START;
    this.score  = 0;
    const _p    = parseInt(localStorage.getItem(LS_KEY), 10);
    this.hiScore = isFinite(_p) && _p >= 0 ? _p : 0;

    // Core systems
    this.bg        = new BackgroundRenderer();
    this.clouds    = new CloudLayer();
    this.kiro      = new Kiro();
    this.spawner   = new ObstacleSpawner();
    this.gates     = new GateSpawner();
    this.powerups  = new PowerUpSpawner();
    this.missiles  = new MissileSpawner();
    this.collider  = new CollisionDetector();
    this.crt       = new CRTOverlay();
    this.ui        = new UIRenderer();
    this.audio     = new AudioManager();
    this.particles = new ParticleSystem();
    this.shake     = new ScreenShake();
    this.squash    = new SquashStretch();
    this.combo     = new ComboTracker();
    this.history   = new RunHistory();
    this.skins     = new SkinManager();
    // Phase 3 systems
    this.diff        = new DifficultyManager();
    this.runStats    = new RunStats();
    this.leaderboard = new Leaderboard();
    this.animScore   = new AnimatedScore();
    // Phase 2 effects
    this.colorFlash      = new ColorFlash();
    this.impossibleOverlay = new ImpossibleOverlay();
    this.slowmoOverlay   = new SlowMoOverlay();

    // Laser
    this._lasers        = [];
    this._laserCooldown = 0;

    // Impossible mode
    this._impossibleTime  = 0;
    this._gravityFlipped  = false;

    // Power-up active states
    this._hasShield    = false;
    this._slowmoTime   = 0;
    this._sizeTimer    = 0;
    this._sizeType     = null;  // 'shrink' | 'grow'

    // Game-over stats
    this._isNewBest     = false;
    this._maxCombo      = 1;
    this._wispTimer     = 0;

    // Phase 2 state
    this._paused         = false;
    this._unlockBanner   = 0;
    this._unlockSkinName = '';
    this._unlockSkinColor = '#ffffff';
    // Phase 3 state
    this._gameOverTab = 0;   // 0=STATS, 1=SKINS, 2=LEADERBOARD

    new InputHandler(
      this.canvas,
      () => this._onFlap(),
      () => this._onLaser(),
      () => this._onSkinCycle()
    );

    // Pause on P key; mute on M key; tab navigation on arrows
    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyP' && this.state === STATE.PLAYING) {
        this._paused = !this._paused;
      }
      if (e.code === 'KeyM') {
        const muted = this.audio.toggle();
        this.colorFlash.trigger(muted ? '#ff4444' : '#44ff88', 0.08);
      }
      // Arrow keys navigate game-over tabs
      if (this.state === STATE.OVER) {
        if (e.code === 'ArrowRight') this._gameOverTab = (this._gameOverTab + 1) % 3;
        if (e.code === 'ArrowLeft')  this._gameOverTab = (this._gameOverTab + 2) % 3;
        if (e.code === 'KeyS') this.skins.nextSkin();
      }
    });

    // Pause when tab is hidden; resume on return
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === STATE.PLAYING) this._paused = true;
    });

    this._lastTime = null;
    requestAnimationFrame((t) => this._loop(t));
  }

  // ── Input ─────────────────────────────────────────────────
  _onFlap() {
    if (this._paused) { this._paused = false; return; }
    if (this.state === STATE.PLAYING) {
      this.kiro.flap(this._gravityFlipped);
      this.audio.playFlap();
      this.squash.triggerFlap();
    } else {
      this._startPlaying();
    }
  }

  _onLaser() {
    if (this.state !== STATE.PLAYING) { this._startPlaying(); return; }
    if (this._laserCooldown > 0) return;
    this._lasers.push(new LaserBeam(this.kiro.x + this.kiro.w / 2, this.kiro.y));
    this._laserCooldown = LASER_RECHARGE;
    this.runStats.lasersFired++;
    this.audio.playLaser();
    this.shake.trigger(3, 0.1);
  }

  _onSkinCycle() {
    this.skins.nextSkin();
  }

  // ── State transitions ─────────────────────────────────────
  _startPlaying() {
    this.score = 0; this._isNewBest = false; this._maxCombo = 1;
    this._laserCooldown = 0; this._impossibleTime = 0; this._gravityFlipped = false;
    this._hasShield = false; this._slowmoTime = 0; this._sizeTimer = 0; this._sizeType = null;
    this._lasers = []; this._wispTimer = 0;
    this._paused = false; this._unlockBanner = 0;
    this._gameOverTab = 0;
    this.diff.setScore(0);
    this.runStats.reset();
    this.animScore.reset();
    this.kiro.reset(); this.kiro.setScale(1);
    this.spawner.reset(); this.gates.reset(); this.powerups.reset();
    this.missiles.reset(); this.clouds.reset(); this.bg.resetScroll();
    this.particles.reset(); this.combo.reset();
    this.state = STATE.PLAYING;
  }

  _triggerGameOver() {
    this._isNewBest = this.score > this.hiScore;
    if (this._isNewBest) this.hiScore = this.score;
    try { localStorage.setItem(LS_KEY, String(this.hiScore)); } catch (_) {}
    const newSkin = this.skins.checkUnlocks(this.hiScore);
    if (newSkin) {
      const sk = this.skins.getCurrentSkin();
      this._unlockBanner   = 3.5;
      this._unlockSkinName  = sk.name;
      this._unlockSkinColor = sk.color;
    }
    this.history.addRun(this.score);
    this.leaderboard.submit(this.score);
    this._gameOverTab = 0;
    this._impossibleTime = 0; this._gravityFlipped = false;
    this.audio.playDeath();
    this.colorFlash.trigger('#ff0000', 0.3);
    this.shake.trigger(8, 0.35);
    this.state = STATE.OVER;
  }

  // ── Update ──────────────────────────────────────────────────
  _update(dt) {
    if (this._paused) return;

    const speedMult = this._slowmoTime > 0 ? SLOWMO_FACTOR : 1;
    this.shake.update(dt);
    this.squash.update(dt);
    this.colorFlash.update(dt);
    this.bg.update(dt, this.state);
    this.clouds.update(dt, this.state);
    this.particles.update(dt);

    if (this.state !== STATE.PLAYING) {
      if (this.state === STATE.START)  this.kiro.time += dt;
      if (this._unlockBanner > 0) this._unlockBanner -= dt;
      return;
    }

    // Timers
    if (this._laserCooldown > 0) this._laserCooldown = Math.max(0, this._laserCooldown - dt);
    if (this._slowmoTime > 0) {
      this._slowmoTime -= dt;
      if (this._slowmoTime <= 0) this._slowmoTime = 0;
    }
    if (this._unlockBanner > 0) this._unlockBanner -= dt;
    if (this._sizeTimer > 0) {
      this._sizeTimer -= dt;
      if (this._sizeTimer <= 0) { this._sizeTimer = 0; this._sizeType = null; this.kiro.setScale(1); }
    }
    if (this._impossibleTime > 0) {
      this._impossibleTime -= dt;
      if (this._impossibleTime <= 0) { this._impossibleTime = 0; this._gravityFlipped = false; }
    }

    this.combo.update(dt);

    // Update difficulty based on live score
    this.diff.setScore(this.score);
    // Animated score counter
    this.animScore.setTarget(this.score);
    this.animScore.update(dt);

    // Physics
    this.kiro.update(dt, this._gravityFlipped, speedMult);

    // Spawners — pass diff so speed + gap scale with score
    this.spawner.update(dt, speedMult, this.diff);
    this.gates.update(dt, speedMult, this.diff);
    this.powerups.update(dt, speedMult, this.diff);
    this.missiles.update(dt * speedMult, this.score, this.kiro.x, this.kiro.y);

    // Play warning beep when a new missile spawns
    if (this.missiles.justSpawned) this.audio.playMissileWarning();

    // Lasers
    for (const beam of this._lasers) beam.update(dt, this.spawner.pipes, this.particles);
    this._lasers = this._lasers.filter(b => b.active);

    // Ghost wisp particles
    this._wispTimer += dt;
    if (this._wispTimer > 0.06) {
      this._wispTimer = 0;
      this.particles.emitWisp(this.kiro.x - this.kiro.w / 2, this.kiro.y);
    }

    // Scoring
    for (const pipe of this.spawner.pipes) {
      if (!pipe.scored && this.kiro.x > pipe.x + PIPE_WIDTH) {
        pipe.scored = true;
        const pts = this.combo.onPipeScored();
        this.score += pts;
        this._maxCombo = Math.max(this._maxCombo, this.combo.multiplier);
        this.runStats.peakCombo = this._maxCombo;
        this.audio.playScore();
        // Score-pop particle at pipe centre
        const popColor = pts > 1 ? '#ff88ff' : '#ffd700';
        const popText  = pts > 1 ? `+${pts} ×${this.combo.multiplier}` : '+1';
        this.particles.emitScorePop(pipe.x + PIPE_WIDTH / 2, this.kiro.y - 30, popText, popColor);
        // Max-combo fanfare
        if (this.combo.multiplier === COMBO_MAX) this.audio.playMaxCombo();
        // Milestone every 10 points
        if (this.score > 0 && this.score % 10 === 0) {
          const milestoneColor = this.score % 50 === 0 ? '#ff44ff' : '#ffd700';
          this.combo.triggerMilestone(`${this.score} PTS!`, milestoneColor);
          this.audio.playMilestone();
        }
      }
    }

    // Gate collection
    const hitGate = this.collider.checkGate(this.kiro, this.gates.gates);
    if (hitGate) {
      hitGate.active = false;
      this._impossibleTime = IMPOSSIBLE_DUR;
      this._gravityFlipped = true;
      this.kiro.vy = 0;
      this.runStats.gatesPassed++;
      this.audio.playImpossible();
      this.shake.trigger(6, 0.25);
    }

    // Power-up collection
    const hitPU = this.collider.checkPowerups(this.kiro, this.powerups.pickups);
    if (hitPU) {
      hitPU.active = false;
      this.runStats.powerupsGot++;
      this.audio.playPowerup();
      this.colorFlash.trigger('#ffffff', 0.1);
      switch (hitPU.type) {
        case 'shield':  this._hasShield = true; break;
        case 'slowmo':
          this._slowmoTime = SLOWMO_DURATION;
          this.audio.playSlowMo();
          break;
        case 'shrink':
          this._sizeTimer = SHRINK_DURATION; this._sizeType = 'shrink';
          this.kiro.setScale(SHRINK_SCALE); break;
        case 'grow':
          this._sizeTimer = GROW_DURATION; this._sizeType = 'grow';
          this.kiro.setScale(GROW_SCALE); break;
      }
    }

    // Missile hit
    const hitMissile = this.collider.checkMissiles(this.kiro, this.missiles.missiles);
    if (hitMissile) {
      hitMissile.active = false;
      this.runStats.missilesEvaded++;
      this.particles.emitExplosion(hitMissile.x, hitMissile.y);
      this.audio.playExplosion();
      if (this._hasShield) {
        this._hasShield = false;
        this.particles.emitShieldBreak(this.kiro.x, this.kiro.y);
        this.audio.playShieldBreak();
        this.kiro.triggerInvincible();
        this.shake.trigger(5, 0.2);
        this.colorFlash.trigger('#ffaa00', 0.15);
      } else {
        this._triggerGameOver(); return;
      }
    }

    // Pipe/boundary collision
    if (this.collider.check(this.kiro, this.spawner.pipes)) {
      if (this._hasShield) {
        this._hasShield = false;
        this.particles.emitShieldBreak(this.kiro.x, this.kiro.y);
        this.audio.playShieldBreak();
        this.audio.playImpact();
        this.kiro.triggerInvincible();
        this.shake.trigger(5, 0.2);
        this.colorFlash.trigger('#ffaa00', 0.15);
        this.kiro.vy = this._gravityFlipped ? TERMINAL_VEL * 0.3 : FLAP_VEL * 0.6;
      } else {
        this._triggerGameOver();
      }
    }
  }

  // ── Draw ────────────────────────────────────────────────────
  _draw() {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.shake.offsetX, this.shake.offsetY);

    // 1. Background — passes score for sky palette cycling
    this.bg.draw(ctx, this.score);
    this.clouds.draw(ctx);

    if (this.state === STATE.PLAYING || this.state === STATE.OVER) {
      this.spawner.draw(ctx);
      this.gates.draw(ctx);
      this.powerups.draw(ctx);
      this.missiles.draw(ctx);
      for (const beam of this._lasers) beam.draw(ctx);
      this.particles.draw(ctx);

      // Shield bubble around Kiro
      if (this._hasShield) {
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008);
        ctx.save();
        ctx.strokeStyle = `rgba(255,215,0,${0.5 + 0.3 * pulse})`;
        ctx.lineWidth   = 2;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur  = 10 + 6 * pulse;
        ctx.beginPath();
        ctx.arc(this.kiro.x, this.kiro.y, this.kiro.w * 0.75, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      this.kiro.draw(ctx, this._gravityFlipped, this.squash, this.skins.getColor());
    }

    // 2. Slow-mo blue vignette (behind HUD)
    this.slowmoOverlay.draw(ctx, this._slowmoTime);
    // 3. Impossible-mode red tint
    this.impossibleOverlay.draw(ctx, this._impossibleTime);
    // 4. Color flash (death/impact/collect)
    this.colorFlash.draw(ctx);

    // 5. HUD / menus
    if (this.state === STATE.START) {
      this.kiro.draw(ctx, false, null, this.skins.getColor());
      this.ui.drawStartMenu(ctx, this.hiScore, this.history, this.skins);
      this.ui.drawMuteButton(ctx, this.audio.isMuted());
    } else if (this.state === STATE.PLAYING) {
      this.ui.drawScore(ctx, this.animScore.value);
      this.ui.drawDifficultyHUD(ctx, this.diff);
      this.ui.drawLaserHUD(ctx, this._laserCooldown);
      this.ui.drawImpossibleHUD(ctx, this._impossibleTime);
      this.ui.drawPowerupTimers(ctx, this._hasShield, this._slowmoTime, this._sizeTimer, this._sizeType);
      this.combo.draw(ctx);
      this.ui.drawMuteButton(ctx, this.audio.isMuted());
      // Missile danger indicator (top-centre warning when a missile is active)
      if (this.missiles.missiles.length > 0) {
        this.ui.drawMissileWarning(ctx, this.missiles.missiles.length);
      }
    } else if (this.state === STATE.OVER) {
      this.ui.drawGameOverMenu(
        ctx, this.score, this.hiScore, this._maxCombo, this._isNewBest,
        this._gameOverTab, this.runStats, this.leaderboard, this.skins,
        this.kiro, this.skins.getColor()
      );
      this.ui.drawMuteButton(ctx, this.audio.isMuted());
    }

    // 6. Skin-unlock banner (appears across state transitions)
    this.ui.drawUnlockBanner(ctx, this._unlockSkinName, this._unlockSkinColor, this._unlockBanner);

    // 7. Pause overlay (drawn before CRT so scanlines still show)
    if (this._paused) this.ui.drawPauseOverlay(ctx);

    ctx.restore();

    // 8. CRT overlay — always absolute last
    this.crt.draw(ctx);
  }

  // ── Main loop ───────────────────────────────────────────────
  _loop(timestamp) {
    let dt;
    if (this._lastTime === null) { dt = 0; }
    else {
      dt = (timestamp - this._lastTime) / 1000;
      if (dt <= 0) dt = 0;
      dt = Math.min(dt, DT_CAP);
    }
    this._lastTime = timestamp;

    // Update (no-ops internally when paused, except for cosmetic timers)
    this._update(dt);
    // Draw always runs so the pause overlay and game-over menu are visible
    this._draw();

    requestAnimationFrame((t) => this._loop(t));
  }
}

// ── Boot ──────────────────────────────────────────────────
window.addEventListener('load', () => new Game());
