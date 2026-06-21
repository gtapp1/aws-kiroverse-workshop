// ============================================================
//  input.js — Keyboard, mouse, touch input handler
// ============================================================
class InputHandler {
  constructor(canvas, onFlap, onLaser, onSkinCycle) {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') { e.preventDefault(); onFlap(); }
      if (e.code === 'KeyF')  { e.preventDefault(); onLaser(); }
      if (e.code === 'KeyS')  { onSkinCycle(); }  // cycle skins on S key
    });
    canvas.addEventListener('mousedown', (e) => { if (e.button === 0) onFlap(); });
    let _lastTap = 0;
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - _lastTap < 300) onLaser(); else onFlap();
      _lastTap = now;
    }, { passive: false });
  }
}
