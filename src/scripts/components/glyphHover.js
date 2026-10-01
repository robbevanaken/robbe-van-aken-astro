// NOT IN USE for now (parked, to come back to): add [data-glyph-hover] to an image box and initGlyphHover(root) to
// mount() in scripts/main.js to switch it back on.
// Glyph hover: hovering an image ([data-glyph-hover]) writes a patch of the R's glyphs around the cursor, in the
// engine's look (r-journey/engine.js: screen cells, crosses, 4×4 Bayer dithering). Towards the cursor the cells go
// from a dim cross over the image, to a bright cross, to a dark cell with an orange cross in the core. The patch opens
// up on enter, follows the cursor softly and closes again on leave. Drawn on a canvas laid over the image, created on
// the first hover. prefers-reduced-motion and touch: nothing.
import gsap from 'gsap';

const CELL = 14;      // css px per glyph cell
const RADIUS = .34;   // patch radius, in parts of the image's longest side
const BG = '#170e0b', DIM = '#8f837c', BRIGHT = '#efe9e4', CORE = '#ff4f00';
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export function initGlyphHover(root = document) {
  const els = [...root.querySelectorAll('[data-glyph-hover]')];
  if (!els.length) return null;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.matchMedia('(hover: hover)').matches) return null;
  const ac = new AbortController(), signal = ac.signal, live = new Set();

  els.forEach((el) => {
    const s = { cv: null, g: null, w: 0, h: 0, dpr: 1, mx: 0, my: 0, x: 0, y: 0, r: 0, over: false };
    const setup = () => {
      if (!s.cv) {
        s.cv = document.createElement('canvas');
        s.cv.className = 'c-featured-projects__glyphs';
        s.cv.setAttribute('aria-hidden', 'true');
        el.append(s.cv);
        s.g = s.cv.getContext('2d');
      }
      s.w = el.offsetWidth; s.h = el.offsetHeight; s.dpr = Math.min(window.devicePixelRatio || 1, 2);
      s.cv.width = Math.round(s.w * s.dpr); s.cv.height = Math.round(s.h * s.dpr);
    };
    // offsetX/Y are in the element's own (untransformed) space, so the bend of the card doesn't matter
    const at = (e) => { s.mx = e.offsetX + (e.target === el ? 0 : e.target.offsetLeft); s.my = e.offsetY + (e.target === el ? 0 : e.target.offsetTop); };
    el.addEventListener('pointerenter', (e) => {
      setup(); at(e);
      if (!s.over && s.r < 1) { s.x = s.mx; s.y = s.my; }
      s.over = true; live.add(s);
    }, { signal });
    el.addEventListener('pointermove', at, { signal });
    el.addEventListener('pointerleave', () => { s.over = false; }, { signal });
  });

  function draw(s, t) {
    const { g, w, h, dpr } = s, R = s.r;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    if (R < 1) return;
    const c0 = Math.max(0, Math.floor((s.x - R) / CELL)), c1 = Math.min(Math.ceil(w / CELL), Math.ceil((s.x + R) / CELL));
    const r0 = Math.max(0, Math.floor((s.y - R) / CELL)), r1 = Math.min(Math.ceil(h / CELL), Math.ceil((s.y + R) / CELL));
    const pad = CELL * .26;
    g.lineWidth = Math.max(1, CELL * .16);
    g.lineCap = 'round';
    for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) {
      const cx = c * CELL + CELL / 2, cy = r * CELL + CELL / 2;
      const d = Math.hypot(cx - s.x, cy - s.y) / R;
      if (d >= 1) continue;
      // closeness to the cursor, dithered (and shimmering a little, like the R's glyphs)
      const b = (BAYER[(r & 3) * 4 + (c & 3)] + .5) / 16;
      const v = 1 - d + (Math.sin(t * 3 + c * .7 + r * .9) * .06) - b * .45;
      if (v < .12) continue;
      const x = c * CELL, y = r * CELL;
      let col = DIM;
      if (v > .62) { g.fillStyle = BG; g.fillRect(x, y, CELL, CELL); col = CORE; }
      else if (v > .34) { g.fillStyle = 'rgba(23,14,11,.55)'; g.fillRect(x, y, CELL, CELL); col = BRIGHT; }
      g.strokeStyle = col;
      g.beginPath();
      g.moveTo(x + pad, y + pad); g.lineTo(x + CELL - pad, y + CELL - pad);
      g.moveTo(x + CELL - pad, y + pad); g.lineTo(x + pad, y + CELL - pad);
      g.stroke();
    }
  }

  const tick = (time) => {
    live.forEach((s) => {
      const max = Math.max(s.w, s.h) * RADIUS;
      s.r += ((s.over ? max : 0) - s.r) * (s.over ? .09 : .12);
      s.x += (s.mx - s.x) * .2; s.y += (s.my - s.y) * .2;
      draw(s, time);
      if (!s.over && s.r < .5) { s.r = 0; draw(s, time); live.delete(s); }
    });
  };
  gsap.ticker.add(tick);

  return () => {
    ac.abort();
    gsap.ticker.remove(tick);
    live.clear();
  };
}
