// The veil: a full-screen canvas used by the page loader and the page transitions (global/pageTransitions.js).
// It speaks the same glyph language as the R engine: the screen is a grid of cells, and a dithered wave sweeps over it
// (leading edge = crosses, orange at the very front, behind it solid background). While the screen is covered the R
// is drawn in the middle as glyphs that dither in, shimmer and dither out again.
//   cover({ x, y })  wave closes from a point (the click) until the screen is covered, the R dithers in
//   reveal()         the R dithers out while the wave bursts open from the centre
//   set(p, rp)       jump to a state without animating (p = cover 0..1, rp = R 0..1)
import gsap from 'gsap';
import { R_PATH } from './r-shape.js';

const BAND = .2;                          // width of the glyph front, in threshold units
const COLORS = ['#6d635d', '#efe9e4', '#ff4f00']; // dim cross, bright cross, accent (same as the engine's glyphs)
const BAYER8 = [0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,
  3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21];
const hash = (a, b) => { let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x7f4a7c15, 0xc2b2ae35); h ^= h >>> 15; return (h >>> 0) / 4294967296; };

export function createVeil(canvas) {
  const ctx = canvas.getContext('2d');
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#170e0b';
  const st = { p: 0, rp: 0, ox: .5, oy: .5, inv: false };
  let W = 0, H = 0, DPR = 1, C = 12, cols = 0, rows = 0, dist = null, rCells = [], sprites = [], raf = 0, active = 0;

  function layout() {
    DPR = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    C = Math.max(8, Math.min(14, Math.round(Math.min(W, H) / 64)));
    cols = Math.ceil(W / C); rows = Math.ceil(H / C);
    sprites = COLORS.map((col) => {
      const px = Math.max(2, Math.round(C * DPR)), c = document.createElement('canvas'); c.width = c.height = px;
      const g = c.getContext('2d'), pad = px * .27;
      g.strokeStyle = col; g.lineWidth = Math.max(1, px * .27); g.lineCap = 'round';
      g.beginPath(); g.moveTo(pad, pad); g.lineTo(px - pad, px - pad); g.moveTo(px - pad, pad); g.lineTo(pad, px - pad); g.stroke();
      return c;
    });
    // the R, rasterised at cell resolution and centred: one glyph per cell, each with its own moment to appear
    const rh = Math.round(Math.min(H * .42, W * .6) / C), rw = Math.round(rh * 103 / 99);
    const oc = document.createElement('canvas'); oc.width = rw; oc.height = rh;
    const o = oc.getContext('2d'), sc = Math.min(rw / 103, rh / 99);
    o.setTransform(sc, 0, 0, sc, 0, 0); o.fillStyle = '#fff'; o.fill(new Path2D(R_PATH));
    const d = o.getImageData(0, 0, rw, rh).data, c0 = Math.round((cols - rw) / 2), r0 = Math.round((rows - rh) / 2);
    const ins = (x, y) => x >= 0 && y >= 0 && x < rw && y < rh && d[(y * rw + x) * 4 + 3] > 100;
    rCells = [];
    for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
      if (!ins(x, y)) continue;
      const edge = !ins(x - 1, y) || !ins(x + 1, y) || !ins(x, y - 1) || !ins(x, y + 1);
      // top to bottom with noise, so it reads like the glyph dither building up
      rCells.push({ q: c0 + x, r: r0 + y, edge, t: Math.min(.98, (y / rh) * .45 + hash(x, y) * .55) });
    }
    origin();
  }

  // distance of every cell to the wave origin, 0..1
  function origin() {
    dist = new Float32Array(cols * rows);
    const ox = st.ox * W, oy = st.oy * H, max = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy)) || 1;
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) dist[r * cols + q] = Math.hypot((q + .5) * C - ox, (r + .5) * C - oy) / max;
  }

  function draw(time = performance.now()) {
    ctx.clearRect(0, 0, W, H);
    const p = st.p * (1 + BAND), front = [];
    if (st.p > 0) {
      ctx.fillStyle = bg; ctx.beginPath();
      for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
        const i = r * cols + q, g = st.inv ? 1 - dist[i] : dist[i];
        const e = p - (g * .72 + (BAYER8[(r & 7) * 8 + (q & 7)] + .5) / 64 * .28);
        if (e > BAND) ctx.rect(q * C, r * C, C + .5, C + .5);
        else if (e > 0) front.push(q, r, e / BAND);
      }
      ctx.fill();
      for (let k = 0; k < front.length; k += 3) {
        const f = front[k + 2], s = f < .12 && hash(front[k], front[k + 1]) < .5 ? 2 : f < .55 ? 1 : 0;
        ctx.drawImage(sprites[s], front[k] * C, front[k + 1] * C, C, C);
      }
    }
    // the R, only on covered cells; a few glyphs shimmer (dim for a moment), fresh ones flash orange
    if (st.rp > 0 && st.p > .5) {
      const tick = Math.floor(time / 90);
      for (let k = 0; k < rCells.length; k++) {
        const c = rCells[k], age = st.rp - c.t;
        if (age <= 0) continue;
        const s = age < .035 ? 2 : hash(k, tick) < (c.edge ? .2 : .06) ? 0 : 1;
        ctx.drawImage(sprites[s], c.q * C, c.r * C, C, C);
      }
    }
  }

  // redraw every frame while a tween runs (the shimmer needs time too)
  const loop = (t) => { draw(t); raf = active ? requestAnimationFrame(loop) : 0; };
  const run = (tl) => new Promise((resolve) => {
    active++; if (!raf) raf = requestAnimationFrame(loop);
    tl.eventCallback('onComplete', () => { active--; draw(); resolve(); });
  });

  layout();
  addEventListener('resize', () => { layout(); draw(); });

  return {
    set(p, rp = st.rp) { st.p = p; st.rp = rp; draw(); },
    // hold the shimmer on screen (loader), returns a stop function
    idle() { active++; if (!raf) raf = requestAnimationFrame(loop); let on = true; return () => { if (on) { on = false; active--; } }; },
    cover({ x = W / 2, y = H / 2 } = {}) {
      st.ox = x / W; st.oy = y / H; st.inv = false; origin();
      return run(gsap.timeline()
        .fromTo(st, { p: 0, rp: 0 }, { p: 1, duration: .75, ease: 'power2.inOut' })
        .to(st, { rp: 1, duration: .45, ease: 'power1.out' }, .45));
    },
    showR(duration = 1) { return run(gsap.timeline().to(st, { rp: 1, duration, ease: 'power1.inOut' })); },
    reveal() {
      st.ox = .5; st.oy = .5; st.inv = true; origin();
      return run(gsap.timeline()
        .to(st, { rp: 0, duration: .3, ease: 'power1.in' })
        .to(st, { p: 0, duration: .85, ease: 'power2.inOut' }, .12));
    },
  };
}
