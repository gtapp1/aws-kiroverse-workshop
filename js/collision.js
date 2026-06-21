// ============================================================
//  collision.js — AABB collision detection
// ============================================================
class CollisionDetector {
  _overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }

  check(kiro, pipes) {
    const kb = kiro.getBounds();
    if (kiro.y + kiro.h / 2 >= CANVAS_H) return true;
    if (kiro.y - kiro.h / 2 <= 0)        return true;
    for (const pipe of pipes) {
      if (this._overlaps(kb, pipe.getTopBounds())) return true;
      if (this._overlaps(kb, pipe.getBotBounds())) return true;
    }
    return false;
  }

  checkGate(kiro, gates) {
    const kb = kiro.getBounds();
    for (const gate of gates) {
      if (gate.active && this._overlaps(kb, gate.getBounds())) return gate;
    }
    return null;
  }

  checkPowerups(kiro, pickups) {
    const kb = kiro.getBounds();
    for (const p of pickups) {
      if (p.active && this._overlaps(kb, p.getBounds())) return p;
    }
    return null;
  }

  checkMissiles(kiro, missiles) {
    const kb = kiro.getBounds();
    for (const m of missiles) {
      if (m.active && this._overlaps(kb, m.getBounds())) return m;
    }
    return null;
  }
}
