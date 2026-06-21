# Requirements Document

## Introduction

Flappy Kiro is a single-file, browser-playable endless side-scrolling arcade game inspired by the classic "Flappy Bird" formula. The player controls Kiro — a vibrant white pixel ghost — navigating through an infinite series of green mechanical pipe obstacles. The game features a 16-bit retro visual style, CRT scanline overlay, frame-independent physics, and persistent high-score tracking. The entire game is delivered as a single `index.html` file using only vanilla HTML5 Canvas and JavaScript, with all assets drawn procedurally.

## Glossary

- **Game**: The overall Flappy Kiro application running in the browser.
- **Kiro**: The player-controlled white ghost protagonist.
- **Pipe**: A pair of green mechanical obstacles (top and bottom) with a gap through which Kiro must pass.
- **Gap**: The open vertical space between the top and bottom pipe of a pair.
- **Score**: The count of pipe pairs Kiro has successfully passed through in the current session.
- **High_Score**: The highest Score achieved across all sessions, persisted in localStorage.
- **Game_Loop**: The recurring render-and-update cycle driven by requestAnimationFrame.
- **FSM**: Finite State Machine governing the game's mode transitions.
- **AABB**: Axis-Aligned Bounding Box, the collision detection method used.
- **Delta_Time**: The elapsed time (in seconds) between consecutive Game_Loop frames.
- **Gravity**: A constant downward acceleration applied to Kiro each frame.
- **Flap**: An upward velocity impulse applied to Kiro in response to player input.
- **Terminal_Velocity**: The maximum downward speed Kiro can reach.
- **Obstacle_Spawner**: The module responsible for procedurally generating and recycling Pipe pairs.
- **Background**: The layered 16-bit twilight sky and pine forest silhouette rendered behind all game objects.
- **CRT_Overlay**: A full-canvas post-processing effect simulating scanlines and monitor curvature.
- **Input_Handler**: The module capturing keyboard, mouse, and touch input events.
- **Physics_Engine**: The module applying Gravity, Flap impulse, and Terminal_Velocity clamping to Kiro.
- **Renderer**: The module responsible for all Canvas 2D drawing operations.
- **Collision_Detector**: The module performing AABB intersection tests between Kiro and Pipes, ceiling, and floor.

---

## Requirements

### Requirement 1: Game State Management

**User Story:** As a player, I want the game to have clear distinct states, so that I understand whether I am on the start screen, playing, or seeing my results after a run.

#### Acceptance Criteria

1. THE FSM SHALL maintain exactly three states: `START_MENU`, `PLAYING`, and `GAME_OVER`.
2. WHEN the Game first loads, THE FSM SHALL enter the `START_MENU` state.
3. WHEN the player presses Space, clicks, or taps while in `START_MENU`, THE FSM SHALL transition to `PLAYING`, resetting Score to 0, Kiro's position to canvas center-left, Kiro's vertical velocity to 0, and clearing all active Pipes.
4. WHEN a collision is detected while in `PLAYING`, THE FSM SHALL transition to `GAME_OVER` without resetting any game state, preserving the final Score and pipe positions for the GAME_OVER display frame.
5. WHEN the player presses Space, clicks, or taps while in `GAME_OVER`, THE FSM SHALL reset all game state (Score, Kiro position and velocity, pipe list) and transition to `PLAYING`.
6. WHILE in `START_MENU`, THE Game SHALL display a title screen with the game name, Kiro rendered at its idle position with tail animation running, and a prompt to begin.
7. WHILE in `GAME_OVER`, THE Game SHALL display the current Score and the High_Score (both as integer values) and a prompt instructing the player to press Space or tap to restart.

---

### Requirement 2: Game Loop and Frame Timing

**User Story:** As a player, I want the game to run smoothly regardless of my device's frame rate, so that the experience feels consistent and fair.

#### Acceptance Criteria

1. THE Game_Loop SHALL use `requestAnimationFrame` as its scheduling mechanism.
2. THE Game_Loop SHALL compute Delta_Time as `(currentTimestamp − previousTimestamp) / 1000`, where timestamps are in milliseconds as provided by `requestAnimationFrame`; IF the computed value is less than or equal to zero (e.g., on the very first frame or due to a clock anomaly), THEN THE Game_Loop SHALL treat Delta_Time as 0 for that frame and perform no physics update.
3. WHEN Delta_Time exceeds 0.1 seconds (e.g., after tab switching or pausing), THE Game_Loop SHALL clamp Delta_Time to 0.1 seconds before passing it to any subsystem.
4. WHILE in `PLAYING`, THE Game_Loop SHALL invoke Physics_Engine, Obstacle_Spawner, Collision_Detector, and Renderer on every frame, in that order; IF the Collision_Detector signals a state transition to `GAME_OVER` mid-sequence, THE Game_Loop SHALL complete the Renderer call for that frame before honoring the transition on the next frame.
5. WHILE in `START_MENU` or `GAME_OVER`, THE Game_Loop SHALL invoke only the Renderer on every frame, leaving Physics_Engine and Obstacle_Spawner idle.

---

### Requirement 3: Physics — Gravity and Flap

**User Story:** As a player, I want Kiro to feel responsive and satisfying to control, so that navigating pipes is a skill-based challenge.

#### Acceptance Criteria

1. WHEN the FSM transitions to `PLAYING`, THE Physics_Engine SHALL initialize Kiro's vertical velocity to 0 pixels per second.
2. WHILE in `PLAYING`, THE Physics_Engine SHALL add `1200 × Delta_Time` pixels per second to Kiro's vertical velocity each frame (positive = downward).
3. WHILE in `PLAYING`, WHEN the player triggers a Flap, THE Physics_Engine SHALL immediately set Kiro's vertical velocity to −420 pixels per second, overwriting any current velocity value.
4. WHILE in `PLAYING`, IF Kiro's vertical velocity exceeds +600 pixels per second, THEN THE Physics_Engine SHALL clamp it to +600 pixels per second before applying position update.
5. WHILE in `PLAYING`, THE Physics_Engine SHALL update Kiro's vertical position each frame by adding `velocity × Delta_Time` pixels.
6. WHEN Kiro's bottom edge (center_y + half_height − hitbox_inset) meets or exceeds the canvas floor (y = canvas height), THE Collision_Detector SHALL register a floor collision and signal `GAME_OVER`.
7. WHEN Kiro's top edge (center_y − half_height + hitbox_inset) meets or goes below the canvas ceiling (y = 0), THE Collision_Detector SHALL register a ceiling collision and signal `GAME_OVER`.

---

### Requirement 4: Player Input

**User Story:** As a player, I want to control Kiro using a keyboard key, mouse click, or screen tap, so that the game is accessible on both desktop and mobile.

#### Acceptance Criteria

1. WHEN the player presses the Space key AND the FSM is in `PLAYING`, THE Input_Handler SHALL emit a Flap event to the Physics_Engine.
2. WHEN the player presses the Space key AND the FSM is in `START_MENU` or `GAME_OVER`, THE Input_Handler SHALL emit a StateAdvance event to the FSM.
3. WHEN the player clicks the canvas with the primary (left) mouse button AND the FSM is in `PLAYING`, THE Input_Handler SHALL emit a Flap event to the Physics_Engine.
4. WHEN the player clicks the canvas with the primary (left) mouse button AND the FSM is in `START_MENU` or `GAME_OVER`, THE Input_Handler SHALL emit a StateAdvance event to the FSM.
5. WHEN the player initiates a touch on the canvas (first touch point only, ignoring additional simultaneous touches) AND the FSM is in `PLAYING`, THE Input_Handler SHALL emit a Flap event to the Physics_Engine.
6. WHEN the player initiates a touch on the canvas AND the FSM is in `START_MENU` or `GAME_OVER`, THE Input_Handler SHALL emit a StateAdvance event to the FSM.
7. WHILE in `PLAYING`, THE Input_Handler SHALL call `preventDefault()` on Space keydown events to suppress browser page-scroll behavior.
8. THE Input_Handler SHALL register all event listeners (keydown, mousedown, touchstart) exactly once during Game initialization and SHALL NOT re-register or remove them on any subsequent state transition.

---

### Requirement 5: Obstacle Generation and Scrolling

**User Story:** As a player, I want a continuous, varied stream of pipe obstacles, so that each run feels different and progressively challenging.

#### Acceptance Criteria

1. THE Obstacle_Spawner SHALL define each Pipe segment's width as 60 pixels.
2. WHILE in `PLAYING`, THE Obstacle_Spawner SHALL decrease each active Pipe's x-coordinate by `200 × Delta_Time` pixels each frame.
3. WHEN the FSM transitions to `PLAYING`, THE Obstacle_Spawner SHALL clear the active Pipe list and immediately spawn one Pipe pair at x = canvas_width + 20, with its Gap center chosen uniformly at random from the integer range [160, canvas_height − 160].
4. WHEN the rightmost active Pipe's left edge has scrolled to x ≤ canvas_width − 220, THE Obstacle_Spawner SHALL spawn a new Pipe pair at x = canvas_width + 20.
5. WHEN a new Pipe pair is spawned, THE Obstacle_Spawner SHALL set its Gap center y-coordinate to a value drawn uniformly at random from [160, canvas_height − 160] (integers), independent of the previous pair's Gap center.
6. THE Obstacle_Spawner SHALL set the Gap height to exactly 160 pixels for every Pipe pair, so the top pipe ends at `gapCenter − 80` and the bottom pipe starts at `gapCenter + 80`.
7. WHEN a Pipe pair's right edge (pipe.x + 60) is less than 0, THE Obstacle_Spawner SHALL remove that Pipe pair from the active list.

---

### Requirement 6: Collision Detection

**User Story:** As a player, I want collisions to be accurate and fair, so that I feel the game outcome reflects my skill.

#### Acceptance Criteria

1. THE Collision_Detector SHALL derive Kiro's inset bounding box from a 32 × 32 pixel sprite box, shrunk by 6 pixels on all sides, yielding an effective collision box of 20 × 20 pixels centered on Kiro's position.
2. THE Collision_Detector SHALL use AABB intersection tests, comparing Kiro's inset bounding box against the axis-aligned bounding box of each active Pipe's top segment and bottom segment.
3. WHEN an AABB intersection is detected between Kiro's inset bounding box and any Pipe segment, THE Collision_Detector SHALL signal the FSM to transition to `GAME_OVER`.
4. WHEN Kiro's inset bounding box top edge (Kiro.y − 10) is less than or equal to 0, THE Collision_Detector SHALL signal `GAME_OVER` for a ceiling collision.
5. WHEN Kiro's inset bounding box bottom edge (Kiro.y + 10) is greater than or equal to canvas_height, THE Collision_Detector SHALL signal `GAME_OVER` for a floor collision.

---

### Requirement 7: Scoring

**User Story:** As a player, I want my score to increase as I pass pipes and my best score to be remembered, so that I have a motivation to improve.

#### Acceptance Criteria

1. WHEN the FSM transitions to `PLAYING`, THE Game SHALL set Score to 0.
2. WHEN Kiro's horizontal center (Kiro.x) crosses the right edge of a Pipe pair (pipe.x + pipe_width) for the first time, THE Game SHALL increment Score by 1; each Pipe pair carries a boolean `scored` flag (initialized to `false` on spawn) that is set to `true` on this event, preventing double-counting for that pair.
3. WHILE in `PLAYING`, THE Renderer SHALL display the current Score as `"SCORE: N"` (where N is the integer Score) in the top-right corner of the canvas, with at least 16 pixels of padding from the right edge and 16 pixels from the top edge.
4. WHEN the FSM transitions to `GAME_OVER`, IF Score > High_Score, THEN THE Game SHALL set High_Score to Score and write it to `localStorage` under the key `"flappyKiroHighScore"` as a base-10 integer string; IF the `localStorage.setItem` call throws (e.g., storage quota exceeded), THE Game SHALL silently ignore the error and retain the in-memory High_Score value.
5. WHEN the Game initializes, THE Game SHALL attempt to read `localStorage.getItem("flappyKiroHighScore")`; IF the value is a non-null string that parses to a finite non-negative integer, THEN THE Game SHALL set High_Score to that integer; OTHERWISE THE Game SHALL set High_Score to 0.

---

### Requirement 8: Visual Rendering — Kiro (Protagonist)

**User Story:** As a player, I want Kiro to look like a charming pixel ghost so that the game has a strong, memorable visual identity.

#### Acceptance Criteria

1. THE Renderer SHALL draw Kiro's body as a closed Canvas 2D path with: a semicircular dome at the top (radius = half of Kiro's sprite width), straight vertical sides descending to the tail region, and a wavy bottom edge formed by three quadratic Bézier curves representing the spectral tail; the fill color SHALL be `#f0f0ff` (near-white with a slight blue tint).
2. THE Renderer SHALL draw two circular eyes on Kiro's face, each with a radius of 7 pixels, filled with `#111122` (near-black), with a 2.5-pixel white highlight dot offset 2 pixels up and to the right, and a 3 × 3 pixel `#7070ff` (blue-violet) pupil dot centered in each eye.
3. WHEN Kiro's vertical velocity is negative (moving upward), THE Renderer SHALL rotate Kiro's sprite counter-clockwise by `min(|velocity| / terminal_velocity, 1) × 20°` around Kiro's center.
4. WHEN Kiro's vertical velocity is positive (moving downward), THE Renderer SHALL rotate Kiro's sprite clockwise by `min(velocity / terminal_velocity, 1) × 30°` around Kiro's center.
5. THE Renderer SHALL animate the three tail Bézier control points by offsetting each control point's y-coordinate by `8 × sin(elapsed_time × 6 + phase_offset)` pixels, where `elapsed_time` is the total seconds since the current `PLAYING` session began and `phase_offset` is 0, 1.2, and 2.4 radians for the three curves respectively; this animation SHALL also run during `START_MENU`.

---

### Requirement 9: Visual Rendering — Pipes

**User Story:** As a player, I want the pipes to look like classic green mechanical obstacles with pixel-art detail, so that the game has a cohesive retro arcade aesthetic.

#### Acceptance Criteria

1. THE Renderer SHALL draw each Pipe body as a filled rectangle using the base color `#388e3c` (medium green), with a 10-pixel-wide left stripe in `#4caf50` (bright green highlight) and an 8-pixel-wide right stripe in `#1b5e20` (dark green shadow), producing a visible 3D depth effect.
2. THE Renderer SHALL draw a 2-pixel-wide solid black (`#000000`) border around the outer perimeter of each Pipe body rectangle.
3. THE Renderer SHALL draw a pipe cap (flange) at the gap-facing end of each Pipe segment: the cap SHALL extend 8 pixels beyond each side of the pipe body (total cap width = pipe_width + 16 pixels) and SHALL be 20 pixels tall in the direction of the gap.
4. THE Renderer SHALL draw each cap using the same three-stripe color treatment as the body (bright left stripe, medium base, dark right stripe) and SHALL draw a 2-pixel black border around the cap rectangle, matching the body border style.

---

### Requirement 10: Visual Rendering — Background

**User Story:** As a player, I want a layered parallax background with a twilight sky and pine forest silhouette, so that the game world feels immersive and visually rich.

#### Acceptance Criteria

1. THE Renderer SHALL draw the background as a vertical linear gradient spanning the full canvas height, transitioning from `#1a0a2e` (deep purple-blue) at y=0 to `#061a06` (near-black green) at y=canvas_height, with intermediate stops at `#0d1b4a` (dark navy) at 35% and `#0a2a2a` (dark teal) at 70%.
2. THE Renderer SHALL draw a pine forest silhouette strip occupying the bottom 160 pixels of the canvas (y = canvas_height − 160 to y = canvas_height), composed of procedurally generated pine tree shapes filled with `#1a4a1a` (dark forest green) with `#2a6a2a` highlight accents on left-facing edges.
3. WHILE in `PLAYING`, THE Renderer SHALL scroll the pine silhouette strip leftward by `60 × Delta_Time` pixels per frame, wrapping seamlessly.
4. THE pine silhouette strip SHALL be pre-rendered onto an offscreen canvas of width ≥ 960 pixels (at least 2× the 480-pixel canvas width), and THE Renderer SHALL draw two consecutive copies of this strip side-by-side each frame to ensure no visible seam during scroll.
5. WHEN the FSM transitions to `PLAYING`, THE Background renderer SHALL reset the scroll offset to 0.
6. THE Renderer SHALL draw the Background (gradient + silhouette) as the first draw call of every frame, before any Pipe, Kiro, or overlay rendering.

---

### Requirement 11: CRT Overlay Effect

**User Story:** As a player, I want a subtle CRT monitor effect over the game canvas, so that the retro arcade cabinet aesthetic is reinforced.

#### Acceptance Criteria

1. WHEN a frame render completes (after all game elements have been drawn), THE Renderer SHALL draw the CRT_Overlay as the final draw operation of that frame.
2. THE CRT_Overlay scanlines SHALL be horizontal dark stripes, each 1 pixel tall, spaced every 2 pixels (i.e., one stripe per even y-coordinate row), with fill color `rgba(0, 0, 0, 0.10)` (black at 10% opacity).
3. THE Renderer SHALL draw a radial gradient vignette centered at the canvas center, fading from fully transparent (`rgba(0,0,0,0)`) at a radius equal to 30% of canvas_height to `rgba(0,0,0,0.55)` (55% opacity black) at a radius equal to 90% of canvas_height, darkening the corners to simulate CRT monitor curvature.
4. THE CRT_Overlay (scanlines + vignette) SHALL be rendered as the final layer, above all game content including Pipes, Kiro, and UI text, on every frame without exception.

---

### Requirement 12: UI and Typography

**User Story:** As a player, I want all on-screen text to use a bold pixelated font, so that the retro arcade aesthetic is consistent throughout the interface.

#### Acceptance Criteria

1. THE Renderer SHALL set `ctx.font` to `bold {size}px "Courier New", monospace` for all in-game text, where `{size}` is the point size appropriate to the text element (see criteria below); no external font files or @font-face declarations are required.
2. THE Renderer SHALL render the score as the string `"SCORE: N"` (N = current integer Score) right-aligned, with the right edge of the text at x = canvas_width − 16 and the text baseline at y = 42, using font size 22px.
3. THE Renderer SHALL render all UI text strings first in `rgba(0,0,0,0.75)` offset by (+2, +2) pixels (drop shadow), then in the primary color at the nominal (x, y) position, producing a consistent 2-pixel dark drop shadow on every text element.
4. WHILE in `START_MENU`, THE Renderer SHALL display `"FLAPPY"` at font size 52px and `"KIRO"` at font size 52px, both horizontally centered (ctx.textAlign = 'center', x = canvas_width / 2), with baselines at y = 230 and y = 288 respectively; and SHALL display the prompt string `"PRESS SPACE / TAP"` and `"TO START"` at font size 15px with baselines at y = 345 and y = 368 respectively.
5. WHILE in `GAME_OVER`, THE Renderer SHALL display `"GAME"` and `"OVER"` at font size 50px centered (x = canvas_width / 2) with baselines at y = 220 and y = 275 respectively; `"SCORE: N"` at font size 20px with baseline at y = 330; `"BEST: N"` (High_Score) at font size 20px with baseline at y = 360; and the restart prompt `"PRESS SPACE / TAP"` and `"TO RESTART"` at font size 15px with baselines at y = 415 and y = 438.

---

### Requirement 13: HTML Shell and Presentation

**User Story:** As a player, I want the game to be presented in a styled browser window that looks like a retro arcade cabinet, so that the overall presentation is polished.

#### Acceptance Criteria

1. THE Game SHALL be delivered as a single `index.html` file with all HTML boilerplate, CSS, and JavaScript contained inline; no `<link>`, `<script src>`, or `<img src>` tags referencing external resources SHALL be present.
2. THE Game SHALL use CSS `display: flex`, `align-items: center`, and `justify-content: center` on the `<body>` to center the canvas element both horizontally and vertically within the browser viewport; the body background color SHALL be `#0a0a0f` (near-black).
3. THE Game SHALL wrap the `<canvas>` in a `<div id="cabinet">` element styled with a dark gradient background (e.g., `#1a1a2e` → `#0f3460`), rounded corners (≥ 12px), and at minimum a 3-pixel solid outer border and a glow `box-shadow` to simulate an arcade cabinet bezel; the cabinet div SHALL include a text label (e.g., `"★ FLAPPY KIRO ★"`) rendered via CSS `::before` pseudo-element.
4. THE `<canvas id="gameCanvas">` element SHALL have `width="480"` and `height="640"` attributes set directly on the element, establishing a fixed 480 × 640 pixel logical resolution; the canvas SHALL also carry the CSS property `image-rendering: pixelated` to prevent sub-pixel anti-aliasing.
5. THE Game SHALL NOT reference any external URLs, CDN scripts, image files, audio files, or font files; all rendering SHALL be performed programmatically via the Canvas 2D API using only colors, gradients, and geometric primitives defined in the JavaScript source.
