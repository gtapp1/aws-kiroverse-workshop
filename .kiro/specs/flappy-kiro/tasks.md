# Implementation Plan: Flappy Kiro

## Overview

Implement Flappy Kiro as a single self-contained `index.html` file using vanilla HTML5 Canvas and JavaScript. The architecture uses modular OO classes inside an IIFE: `Game` (FSM + main loop), `Kiro`, `PipePair`, `ObstacleSpawner`, `CollisionDetector`, `InputHandler`, `BackgroundRenderer`, `CRTOverlay`, and `UIRenderer`. All assets are drawn procedurally — no external resources. A Vitest + fast-check test suite validates the pure logic layer.

---

## Tasks

- [x] 1. Set up project structure, constants, and HTML shell
  - Create the single `index.html` file with inline `<style>` and `<script>` blocks
  - Add the CSS arcade-cabinet layout: `body` with `display:flex`, centered `#cabinet` div with dark gradient background, rounded corners (≥12px), 3px solid border, `box-shadow` glow, and `::before` pseudo-element label `"★ FLAPPY KIRO ★"`
  - Add `<canvas id="gameCanvas" width="480" height="640">` inside `#cabinet` with `image-rendering: pixelated`
  - Define all constants inside the IIFE: `CANVAS_W`, `CANVAS_H`, `GRAVITY`, `FLAP_VEL`, `TERMINAL_VEL`, `PIPE_SPEED`, `PIPE_GAP` (160), `PIPE_WIDTH` (60), `PIPE_SPACING` (220), `PIPE_MIN_Y` (160), `PIPE_MAX_Y` (`CANVAS_H - 160`), `TREE_SPEED`, `HIT_INSET` (6), `DT_CAP` (0.1), `LS_KEY`
  - Define `const STATE = { START: 'START_MENU', PLAYING: 'PLAYING', OVER: 'GAME_OVER' }`
  - Bootstrap `canvas` and `ctx` references
  - Verify no external `<link>`, `<script src>`, `<img src>` tags are present
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 2. Implement `Game` class — FSM, main loop, scoring, and high-score persistence
  - [x] 2.1 Implement `Game` constructor, FSM state, and `localStorage` initialization
    - Initialize `state = STATE.START`, `score = 0`
    - Read `localStorage.getItem(LS_KEY)`, parse with `parseInt(..., 10)`, default to `0` for null / non-finite / negative values
    - Instantiate all subsystem objects (stubs acceptable at this stage)
    - _Requirements: 1.1, 1.2, 7.5_

  - [x] 2.2 Implement `_loop(timestamp)` with delta-time clamping
    - On first frame (`_lastTime === null`), set `dt = 0` and skip physics
    - Compute `dt = (timestamp - _lastTime) / 1000`; if `dt ≤ 0`, treat as `0`
    - Clamp `dt` to `DT_CAP` (0.1 s) before passing to any subsystem
    - Gate subsystem calls by FSM state per the design table
    - Schedule next frame with `requestAnimationFrame`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 2.3 Write property test for delta-time clamping
    - **Property 1: Delta-time clamping**
    - **Validates: Requirements 2.3**

  - [x] 2.4 Implement `_startPlaying()`, `_triggerGameOver()`, and `_checkScoring()`
    - `_startPlaying()`: reset `score = 0`, call `kiro.reset()`, `spawner.reset()`, `bg.resetScroll()`, set `state = STATE.PLAYING`
    - `_triggerGameOver()`: compare `score > hiScore`, update `hiScore`, wrap `localStorage.setItem` in `try/catch` (silent on error), set `state = STATE.OVER`
    - `_checkScoring()`: iterate pipes; when `!pipe.scored && kiro.x > pipe.x + PIPE_WIDTH`, set `pipe.scored = true`, increment `score`
    - _Requirements: 1.3, 1.4, 1.5, 7.1, 7.2, 7.4_

  - [ ]* 2.5 Write property test for high-score localStorage round-trip
    - **Property 7: High-score localStorage round-trip**
    - **Validates: Requirements 7.4, 7.5**

  - [ ]* 2.6 Write property test for score-per-pipe monotonicity
    - **Property 6: Each pipe pair is scored exactly once**
    - **Validates: Requirements 7.2**

- [x] 3. Implement `Kiro` class — physics, flap, hitbox, and drawing
  - [x] 3.1 Implement `Kiro` constructor, `reset()`, `flap()`, and `update(dt)`
    - `reset()`: set `x = 120`, `y = CANVAS_H / 2`, `vy = 0`, `time = 0`
    - `flap()`: set `vy = FLAP_VEL` (−420) unconditionally
    - `update(dt)`: accumulate `time += dt`; apply gravity `vy += GRAVITY * dt`; clamp `vy = Math.min(vy, TERMINAL_VEL)`; update `y += vy * dt`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 3.2 Write property test for flap unconditionally overrides velocity
    - **Property 2: Flap unconditionally overrides velocity**
    - **Validates: Requirements 3.3**

  - [ ]* 3.3 Write property test for terminal velocity is never exceeded
    - **Property 3: Terminal velocity is never exceeded**
    - **Validates: Requirements 3.4**

  - [x] 3.4 Implement `getBounds()` returning the inset AABB
    - Return `{ x: kiro.x - w/2 + HIT_INSET, y: kiro.y - h/2 + HIT_INSET, w: w - 2*HIT_INSET, h: h - 2*HIT_INSET }`
    - _Requirements: 6.1_

  - [x] 3.5 Implement `Kiro.draw()` — ghost body, eyes, tilt, and tail animation
    - Draw ghost body as closed Canvas 2D path: semicircular dome (`ctx.arc`), straight vertical sides, three quadratic Bézier tail curves animated with `8 × sin(time × 6 + phase)` for phases 0, 1.2, 2.4 rad; fill `#f0f0ff`
    - Draw two circular eyes (radius 7, fill `#111122`), 2.5px white highlight dots offset (+2, −2), 3×3px `#7070ff` pupils
    - Apply tilt via `ctx.rotate`: counter-clockwise up to 20° when `vy < 0`, clockwise up to 30° when `vy > 0`, interpolated by `min(|vy| / TERMINAL_VEL, 1)`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 3.6 Write property test for tail animation offsets are always bounded
    - **Property 9: Tail animation offsets are always bounded**
    - **Validates: Requirements 8.5**

- [x] 4. Checkpoint — Core physics verified
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement `PipePair` class and `ObstacleSpawner`
  - [x] 5.1 Implement `PipePair` constructor, getters, `update(dt)`, `getTopBounds()`, `getBotBounds()`
    - Constructor: `x`, `gapCenterY`, `scored = false`
    - Computed getters: `topPipeH = gapCenterY - PIPE_GAP/2`; `botPipeY = gapCenterY + PIPE_GAP/2`; `botPipeH = CANVAS_H - botPipeY`
    - `getTopBounds()`: `{ x, y: 0, w: PIPE_WIDTH, h: topPipeH }`
    - `getBotBounds()`: `{ x, y: botPipeY, w: PIPE_WIDTH, h: botPipeH }`
    - `update(dt)`: `x -= PIPE_SPEED * dt`
    - _Requirements: 5.1, 5.2, 5.6_

  - [ ]* 5.2 Write property test for pipe gap is always exactly 160 pixels
    - **Property 4: Pipe gap is always exactly 160 pixels**
    - **Validates: Requirements 5.6**

  - [x] 5.3 Implement `ObstacleSpawner` — `reset()`, `update(dt)`, `draw()`
    - `reset()`: clear `pipes = []`; spawn one initial pair at `x = CANVAS_W + 20` with random gap center in `[PIPE_MIN_Y, PIPE_MAX_Y]`
    - `update(dt)`: scroll all pipes; spawn new pair when rightmost pipe's left edge `≤ CANVAS_W − PIPE_SPACING`; cull pipes where `x + PIPE_WIDTH < 0`
    - `draw()`: call `pipe.draw()` for each active pipe
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.7_

  - [ ]* 5.4 Write property test for pipe gap center always stays in bounds
    - **Property 5: Pipe gap center always stays in bounds**
    - **Validates: Requirements 5.3, 5.5**

  - [x] 5.5 Implement `PipePair.draw()` with 3-stripe body, black border, and gap-facing cap
    - Draw pipe body rectangle: base fill `#388e3c`, left stripe `#4caf50` (10px wide), right stripe `#1b5e20` (8px wide), 2px black border
    - Draw cap flange at gap-facing end: width `PIPE_WIDTH + 16`, height 20px, same 3-stripe treatment, 2px black border
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 6. Implement `CollisionDetector`
  - [x] 6.1 Implement `_overlaps(a, b)` AABB intersection test
    - Standard AABB overlap: `a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y`
    - _Requirements: 6.2_

  - [ ]* 6.2 Write property test for AABB intersection is commutative
    - **Property 8: AABB intersection test is commutative**
    - **Validates: Requirements 6.2**

  - [x] 6.3 Implement `check(kiro, pipes)` — floor, ceiling, and pipe collision
    - Floor: return `true` if `kiro.y + 10 >= CANVAS_H` (using inset bounds bottom edge)
    - Ceiling: return `true` if `kiro.y - 10 <= 0` (using inset bounds top edge)
    - Pipes: iterate active pipes; call `_overlaps` against both `getTopBounds()` and `getBotBounds()`
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 3.6, 3.7_

- [x] 7. Implement `InputHandler`
  - Register `keydown`, `mousedown`, and `touchstart` listeners exactly once on construction; never remove or re-register on state transitions
  - `keydown`: only fire callback on `e.code === 'Space'`; call `e.preventDefault()` to suppress page scroll
  - `mousedown`: fire callback on primary button only
  - `touchstart`: fire callback on first touch point only; call `e.preventDefault()` to suppress scroll
  - Wire callback to `Game._onInput()` which routes to `kiro.flap()` when `PLAYING` or `_startPlaying()` otherwise
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 8. Implement `BackgroundRenderer`
  - [x] 8.1 Implement pine silhouette pre-rendering onto offscreen canvas (960 × 160)
    - Use a seeded LCG RNG for deterministic tree placement
    - Draw procedural pine trees with 4 layered triangular segments, `#1a4a1a` fill, `#2a6a2a` highlight accents on left-facing edges
    - _Requirements: 10.2, 10.4_

  - [x] 8.2 Implement `update(dt, state)` and `draw()`
    - `update()`: advance `treeOff += TREE_SPEED * dt` only in `PLAYING` state; wrap modulo `CANVAS_W`
    - `draw()`: render sky gradient (4 stops: `#1a0a2e` → `#0d1b4a` at 35% → `#0a2a2a` at 70% → `#061a06`); draw static star dots; tile tree strip with two `drawImage` calls to ensure seamless scroll
    - Add `resetScroll()` method setting `treeOff = 0` (called by `_startPlaying()`)
    - _Requirements: 10.1, 10.3, 10.4, 10.5, 10.6_

- [x] 9. Implement `CRTOverlay`
  - Pre-bake 1 × `CANVAS_H` scanline strip at construction: 1px `rgba(0,0,0,0.10)` stripe on every even row
  - `draw()`: tile strip with `ctx.createPattern(..., 'repeat-x')` to fill canvas; draw radial gradient vignette from `rgba(0,0,0,0)` at `0.3 × CANVAS_H` radius to `rgba(0,0,0,0.55)` at `0.9 × CANVAS_H` radius, centered on canvas
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 10. Implement `UIRenderer`
  - `_shadow(x, y, text, size, color)`: render text twice — shadow at (+2,+2) in `rgba(0,0,0,0.75)`, then primary color at nominal position; font: `bold {size}px "Courier New", monospace`
  - `drawScore(score)`: right-aligned `"SCORE: N"` at `x = CANVAS_W - 16`, `y = 42`, size 22px
  - `drawStartMenu(highScore)`: display `"FLAPPY"` (52px, y=230) and `"KIRO"` (52px, y=288) centered; prompts `"PRESS SPACE / TAP"` (15px, y=345) and `"TO START"` (15px, y=368)
  - `drawGameOver(score, highScore)`: display `"GAME"` (50px, y=220), `"OVER"` (50px, y=275); `"SCORE: N"` (20px, y=330); `"BEST: N"` (20px, y=360); restart prompts (15px, y=415 and y=438)
  - _Requirements: 1.6, 1.7, 7.3, 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 11. Wire all components together in `Game` and boot
  - Connect `Game._loop()` rendering order: Background → Pipes → Kiro → Score/UI → CRT (always last)
  - Ensure `state === STATE.OVER` renders frozen pipes and Kiro at collision position before showing game-over UI
  - Ensure `state === STATE.START` renders idle Kiro with tail animation running but no physics update
  - Register `window.addEventListener('load', () => new Game())` to boot the game
  - Verify the collision-then-render ordering: if `CollisionDetector.check()` returns `true`, call `_triggerGameOver()` after the current frame's `Renderer` call completes
  - _Requirements: 1.6, 1.7, 2.4, 2.5, 10.6, 11.4_

- [x] 12. Final checkpoint — Full integration verified
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The game is a single `index.html` — all implementation lives in that one file
- Property tests (fast-check) and unit tests (Vitest) are in a separate `tests/` directory alongside the HTML, not embedded in it
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties across large input spaces
- Unit tests validate specific examples and edge cases

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "5.1"] },
    { "id": 2, "tasks": ["2.2", "3.4", "5.3", "6.1", "8.1"] },
    { "id": 3, "tasks": ["2.3", "2.4", "3.2", "3.3", "3.5", "5.2", "5.4", "6.2", "8.2"] },
    { "id": 4, "tasks": ["2.5", "2.6", "3.6", "5.5", "6.3", "9"] },
    { "id": 5, "tasks": ["6.3", "7", "10"] },
    { "id": 6, "tasks": ["11"] }
  ]
}
```
