// ============================================================
//  game.js — Main Game class (FSM + loop + wiring)
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

    new InputHandler(
      this.canvas,
      () => this._onFlap(),
      () => this._onLaser(),
      () => this._onSkinCycle()
    );

    this._lastTime = null;
    requestAnimationFrame((t) => this._loop(t));
  }

  // ── Input ─────────────────────────────────────────────────
  _onFlap() {
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
    this.skins.checkUnlocks(this.hiScore);
    this.history.addRun(this.score);
    this._impossibleTime = 0; this._gravityFlipped = false;
    this.audio.playDeath();
    this.shake.trigger(8, 0.35);
    this.state = STATE.OVER;
  }

  // ── Update ──────────────────────────────────────────────────
  _update(dt) {
    const speedMult = this._slowmoTime > 0 ? SLOWMO_FACTOR : 1;
    this.shake.update(dt);
    this.squash.update(dt);
    this.bg.update(dt, this.state);
    this.clouds.update(dt, this.state);
    this.particles.update(dt);

    if (this.state !== STATE.PLAYING) {
      if (this.state === STATE.START) this.kiro.time += dt;
      return;
    }

    // Timers
    if (this._laserCooldown > 0) this._laserCooldown = Math.max(0, this._laserCooldown - dt);
    if (this._slowmoTime > 0) { this._slowmoTime -= dt; if (this._slowmoTime <= 0) this._slowmoTime = 0; }
    if (this._sizeTimer > 0) {
      this._sizeTimer -= dt;
      if (this._sizeTimer <= 0) { this._sizeTimer = 0; this._sizeType = null; this.kiro.setScale(1); }
    }
    if (this._impossibleTime > 0) {
      this._impossibleTime -= dt;
      if (this._impossibleTime <= 0) { this._impossibleTime = 0; this._gravityFlipped = false; }
    }

    this.combo.update(dt);

    // Physics
    this.kiro.update(dt, this._gravityFlipped, speedMult);

    // Spawners
    this.spawner.update(dt, speedMult);
    this.gates.update(dt, speedMult);
    this.powerups.update(dt, speedMult);
    this.missiles.update(dt, this.score, this.kiro.x, this.kiro.y);

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
        this.audio.playScore();
        // Milestone check every 10 points
        if (this.score > 0 && this.score % 10 === 0) {
          this.combo.triggerMilestone(`${this.score} PTS!`);
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
      this.audio.playImpossible();
      this.shake.trigger(6, 0.25);
    }

    // Power-up collection
    const hitPU = this.collider.checkPowerups(this.kiro, this.powerups.pickups);
    if (hitPU) {
      hitPU.active = false;
      this.audio.playPowerup();
      switch (hitPU.type) {
        case 'shield':  this._hasShield = true; break;
        case 'slowmo':  this._slowmoTime = SLOWMO_DURATION; break;
        case 'shrink':  this._sizeTimer = SHRINK_DURATION; this._sizeType = 'shrink'; this.kiro.setScale(SHRINK_SCALE); break;
        case 'grow':    this._sizeTimer = GROW_DURATION; this._sizeType = 'grow'; this.kiro.setScale(GROW_SCALE); break;
      }
    }

    // Missile hit
    const hitMissile = this.collider.checkMissiles(this.kiro, this.missiles.missiles);
    if (hitMissile) {
      hitMissile.active = false;
      if (this._hasShield) {
        this._hasShield = false;
        this.particles.emitShieldBreak(this.kiro.x, this.kiro.y);
        this.audio.playShieldBreak();
        this.shake.trigger(5, 0.2);
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
        this.shake.trigger(5, 0.2);
        // Push Kiro slightly away from collision
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

    this.bg.draw(ctx);
    this.clouds.draw(ctx);

    if (this.state === STATE.PLAYING || this.state === STATE.OVER) {
      this.spawner.draw(ctx);
      this.gates.draw(ctx);
      this.powerups.draw(ctx);
      this.missiles.draw(ctx);
      for (const beam of this._lasers) beam.draw(ctx);
      this.particles.draw(ctx);

      // Shield indicator around Kiro
      if (this._hasShield) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,215,0,0.6)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.kiro.x, this.kiro.y, this.kiro.w * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      this.kiro.draw(ctx, this._gravityFlipped, this.squash, this.skins.getColor());
    }

    if (this.state === STATE.START) {
      this.kiro.draw(ctx, false, null, this.skins.getColor());
      this.ui.drawStartMenu(ctx, this.hiScore, this.history, this.skins);
    } else if (this.state === STATE.PLAYING) {
      this.ui.drawScore(ctx, this.score);
      this.ui.drawLaserHUD(ctx, this._laserCooldown);
      this.ui.drawImpossibleHUD(ctx, this._impossibleTime);
      this.ui.drawPowerupTimers(ctx, this._hasShield, this._slowmoTime, this._sizeTimer, this._sizeType);
      this.combo.draw(ctx);
    } else if (this.state === STATE.OVER) {
      this.ui.drawGameOverMenu(ctx, this.score, this.hiScore, this._maxCombo, this._isNewBest);
    }

    ctx.restore();
    this.crt.draw(ctx);
  }

  // ── Main loop ───────────────────────────────────────────────
  _loop(timestamp) {
    let dt;
    if (this._lastTime === null) { dt = 0; }
    else { dt = (timestamp - this._lastTime) / 1000; if (dt <= 0) dt = 0; dt = Math.min(dt, DT_CAP); }
    this._lastTime = timestamp;
    this._update(dt);
    this._draw();
    requestAnimationFrame((t) => this._loop(t));
  }
}

// ── Boot ──────────────────────────────────────────────────
window.addEventListener('load', () => new Game());
