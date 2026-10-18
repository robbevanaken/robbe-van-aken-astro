// A dozen pixels trailing the pointer (Oct 2026; replaces a full halftone brush that was too much): twelve squares on
// the R's 8px grid, each easing after the one before it, the first after the pointer, so they string out behind it as
// it moves and gather on it as it stops; they get smaller down the chain and fade out a moment after the pointer rests.
// One fixed canvas over the whole site (white, a `difference` blend: it inverts what it crosses), drawn only while
// something moves. Fine pointers only; off with reduced motion, while the loader / a page swap covers the page and while
// the contact popup or the menu is open.
export function initPixelTrail() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cvs = document.createElement('canvas');
  cvs.className = 'c-pixel-trail'; cvs.setAttribute('aria-hidden', 'true');
  document.body.append(cvs);
  const ctx = cvs.getContext('2d');
  const N = 12, GRID = 8, FOLLOW = .42, IDLE = 900; // pixels, the grid (css px), how quickly each catches the one ahead, ms to fade after resting
  let W = 0, H = 0, dpr = 1, raf = 0, last = 0, moved = 0, alpha = 0;
  const pts = Array.from({ length: N }, () => ({ x: -100, y: -100 }));
  const resize = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cvs.width = W * dpr; cvs.height = H * dpr; cvs.style.width = `${W}px`; cvs.style.height = `${H}px`; };
  resize(); addEventListener('resize', resize);
  let tx = null, ty = null;
  const blocked = () => { const h = document.documentElement.classList; return h.contains('is-loading') || h.contains('is-transitioning') || h.contains('is-covered') || h.contains('is-contact-open') || h.contains('is-menu-open'); };
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || blocked()) { tx = null; return; }
    if (tx === null) pts.forEach((p) => { p.x = e.clientX; p.y = e.clientY; }); // arriving: the chain starts on the pointer
    tx = e.clientX; ty = e.clientY; moved = performance.now();
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: true });
  document.addEventListener('pointerleave', () => { tx = null; });
  function frame(t) {
    raf = 0;
    const dt = last ? Math.min(50, t - last) / 16.67 : 1; last = t;
    const k = 1 - Math.pow(1 - FOLLOW, dt);
    let lead = tx === null ? pts[0] : { x: tx, y: ty }, spread = 0;
    for (const p of pts) { p.x += (lead.x - p.x) * k; p.y += (lead.y - p.y) * k; spread += Math.abs(lead.x - p.x) + Math.abs(lead.y - p.y); lead = p; }
    const resting = tx === null || t - moved > IDLE;
    alpha += ((resting ? 0 : 1) - alpha) * (resting ? .08 : .25) * dt;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    if (alpha > .01) {
      ctx.fillStyle = '#ffffff';
      pts.forEach((p, i) => {
        const s = Math.max(2, Math.round(GRID * (1 - i / N * .7))), x = Math.round(p.x / GRID) * GRID, y = Math.round(p.y / GRID) * GRID; // on the grid: pixels, not dots
        ctx.globalAlpha = alpha * (1 - i / N * .6) * .75;
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      });
    }
    cvs.classList.toggle('is-on', alpha > .01);
    if (alpha > .01 || spread > .5) raf = requestAnimationFrame(frame); else last = 0;
  }
}
