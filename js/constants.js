// ============================================================
//  constants.js — All game constants (shared across modules)
// ============================================================
const CANVAS_W        = 480;
const CANVAS_H        = 640;
const GRAVITY         = 1200;
const FLAP_VEL        = -420;
const TERMINAL_VEL    = 600;
const PIPE_SPEED      = 200;
const PIPE_GAP        = 160;
const PIPE_WIDTH      = 60;
const PIPE_SPACING    = 220;
const PIPE_MIN_Y      = 160;
const PIPE_MAX_Y      = CANVAS_H - 160;
const TREE_SPEED      = 60;
const HIT_INSET       = 6;
const LS_KEY          = 'flappyKiroHighScore';
const DT_CAP          = 0.1;

// Laser
const LASER_RECHARGE  = 20;
const LASER_SPEED     = 900;
const LASER_HOLE_H    = 60;

// Impossible mode
const IMPOSSIBLE_DUR  = 10;

// Gate
const GATE_W          = 20;
const GATE_H          = 120;
const GATE_SPACING    = 600;

// Power-ups
const SHIELD_DURATION = Infinity;  // lasts until hit
const SLOWMO_DURATION = 5;
const SLOWMO_FACTOR   = 0.5;
const SHRINK_DURATION = 8;
const GROW_DURATION   = 8;
const SHRINK_SCALE    = 0.6;
const GROW_SCALE      = 1.5;
const POWERUP_SPEED   = 150;      // px/s leftward
const POWERUP_SPACING = 500;      // px travel between spawns

// Missiles
const MISSILE_SPEED       = 280;
const MISSILE_TURN_RATE   = 3.5;  // radians/s max turn
const MISSILE_SPAWN_SCORE = 15;   // start spawning after this score
const MISSILE_INTERVAL    = 4;    // seconds between missiles

// Screen shake
const SHAKE_INTENSITY = 5;
const SHAKE_DURATION  = 0.2;

// Combo
const COMBO_WINDOW    = 1.5;  // seconds to pass next pipe to keep combo
const COMBO_MAX       = 5;

// Difficulty scaling (progressive ramp over score)
const DIFF_SPEED_START  = 200;   // base pipe speed (px/s)
const DIFF_SPEED_MAX    = 380;   // cap
const DIFF_SPEED_RATE   = 3;     // added px/s per point
const DIFF_GAP_START    = 160;   // base gap (px)
const DIFF_GAP_MIN      = 110;   // minimum gap
const DIFF_GAP_SHRINK   = 0.5;   // gap shrinks by this many px per point

// FSM states
const STATE = { START: 'START_MENU', PLAYING: 'PLAYING', OVER: 'GAME_OVER' };

// ── Canvas API polyfill ────────────────────────────────────
// ctx.roundRect is not available in all browsers (Firefox < 112).
// Patch it onto CanvasRenderingContext2D.prototype if missing.
if (typeof CanvasRenderingContext2D !== 'undefined' &&
    !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const radius = Math.min(r || 0, Math.abs(w) / 2, Math.abs(h) / 2);
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + w - radius, y);
    this.quadraticCurveTo(x + w, y, x + w, y + radius);
    this.lineTo(x + w, y + h - radius);
    this.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    this.lineTo(x + radius, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
  };
}
