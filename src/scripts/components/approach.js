// How I work (sections/Approach.astro, on /contact): a horizontal reel of cards on a pinned stage, driven by scroll only.
// - The pin track ([data-approach-pin]) is one screen (or the stage, if taller: --stage-h) + D tall (--dist, D = how far
//   the reel overflows its viewport); while its stage sticks, the scroll (p 0 … 1 over D) slides the reel left by D.
// - Reading point: it sweeps the line from left to right as p runs, so card i is reached at p = its left edge /
//   (D + content width). Each card's segment of the line is as long as its share of that sweep; the fill follows p,
//   and the R (the arrow, [data-r-pointer], drawn by the section's own engine, stage 6) rides on the head of the fill
//   (--x, its box kept on the line), facing the way you last scrolled (data-dir: the engine turns it round).
// - Every card lights up from 35% to full as the arrow passes its first half (like the highlight texts); the corner
//   brackets ([data-approach-frame]) glide to the card it's on. The foot (line + arrow, [data-approach-foot]) only shows
//   while the stage is pinned. Phones (one card at a time): the reading point is the middle of the screen, so the lit
//   card is the one in view, and the reel ends with the last card centred.
// Measured again on resize and once the fonts are in (then ScrollTrigger refreshes: the page height changed).
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const DIM = .35; // a card's opacity before the arrow reaches it (reduced motion: no dimming)
const PAD = 16;  // px the brackets sit outside the card
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export function initApproach(root = document) {
  const el = root.querySelector('[data-approach]');
  if (!el) return null;
  const q = (s) => el.querySelector(s);
  const pin = q('[data-approach-pin]'), stage = q('[data-approach-stage]'), viewport = q('[data-approach-viewport]'), track = q('[data-approach-track]');
  const progress = q('[data-approach-progress]'), foot = q('[data-approach-foot]'), ptr = q('[data-r-pointer]'), frame = q('[data-approach-frame]');
  const items = [...el.querySelectorAll('[data-approach-item]')], bars = [...el.querySelectorAll('[data-approach-bar]')];
  if (!pin || !viewport || !track || !progress || !ptr || !items.length || bars.length !== items.length) return null;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, dim = reduce ? 1 : DIM;
  const ac = new AbortController();
  const dur = reduce ? 0 : .7;
  const fx = gsap.quickTo(frame, 'x', { duration: dur, ease: 'power3' }), fy = gsap.quickTo(frame, 'y', { duration: dur, ease: 'power3' });
  const fw = gsap.quickTo(frame, 'width', { duration: dur, ease: 'power3' }), fh = gsap.quickTo(frame, 'height', { duration: dur, ease: 'power3' });

  let D = 0, L = [], Wd = [], start = [], p = -1, dir = 1, first = true;
  const end = (i) => start[i + 1] ?? 1;

  function measure() {
    track.style.transform = 'none';
    const vw = viewport.clientWidth - track.offsetLeft * 2; // the content width (inside the page margins)
    // the reel's length: up to the end of the last card plus the room after it (a gap + the track's ::after);
    // phones (the reading point is the middle of the screen): up to the last card centred
    const lc = items[items.length - 1], tail = (parseFloat(getComputedStyle(track).columnGap) || 0) + (parseFloat(getComputedStyle(track, '::after').width) || 0);
    D = Math.max(0, Math.round(innerWidth < 640 ? lc.offsetLeft + lc.offsetWidth / 2 - vw / 2 : lc.offsetLeft + lc.offsetWidth + tail - vw));
    pin.style.setProperty('--dist', `${D}px`);
    pin.style.setProperty('--stage-h', `${stage?.offsetHeight || 0}px`); // a short screen: the stage is taller than one
    L = items.map((it) => it.offsetLeft); Wd = items.map((it) => it.offsetWidth);
    start = L.map((l) => l / (D + vw));
    bars.forEach((b, i) => b.style.flexGrow = String((end(i) - start[i]).toFixed(4)));
    p = -1; first = true;
    update();
  }

  function update() {
    const pr = pin.getBoundingClientRect();
    foot?.classList.toggle('is-hidden', !(pr.top <= 1 && pr.bottom >= innerHeight - 1));
    const np = D ? clamp(-pr.top / D, 0, 1) : 0;
    if (np === p) return;
    if (p >= 0 && np !== p) { const d = np > p ? 1 : -1; if (d !== dir) { dir = d; ptr.dataset.dir = String(d); } }
    p = np;
    const shift = p * D;
    track.style.transform = `translate3d(${(-shift).toFixed(1)}px,0,0)`;
    // the line and the arrow on the head of its fill
    let s = 0;
    for (let i = 0; i < start.length; i++) if (start[i] <= p + 1e-4) s = i;
    bars.forEach((b, i) => b.style.setProperty('--fill', clamp((p - start[i]) / (end(i) - start[i]), 0, 1).toFixed(4)));
    const bar = bars[s], x = bar.offsetLeft + clamp((p - start[s]) / (end(s) - start[s]), 0, 1) * bar.offsetWidth;
    // the arrow's box stays on the line: the fill's head (0 … W) mapped onto half a box in from either end
    const W = progress.offsetWidth, ps = ptr.offsetWidth;
    ptr.style.setProperty('--x', `${(ps / 2 + x / W * (W - ps)).toFixed(1)}px`);
    // light the cards the reading point has reached (all positions relative to the viewport's box): the arrow, or on
    // phones the middle of the screen (a card is lit once it's centred)
    const tx = track.offsetLeft, ty = track.offsetTop, phone = innerWidth < 640;
    const rx = phone ? viewport.clientWidth / 2 : x + progress.offsetLeft - viewport.offsetLeft;
    let a = 0, best = Infinity;
    items.forEach((it, i) => {
      const left = tx + L[i] - shift, lit = i === 0 ? 1 : clamp((rx - left) / (Wd[i] * .5), 0, 1);
      it.style.opacity = (dim + (1 - dim) * lit).toFixed(3);
      if (phone) { const d = Math.abs(left + Wd[i] / 2 - rx); if (d < best) { best = d; a = i; } }
      else if (left <= rx + 1) a = i;
    });
    // the brackets: around the card the reading point is on, following the reel
    const box = { x: tx + L[a] - shift - PAD, y: ty + items[a].offsetTop - PAD, width: Wd[a] + PAD * 2, height: items[a].offsetHeight + PAD * 2 };
    if (first) gsap.set(frame, box); else { fx(box.x); fy(box.y); fw(box.width); fh(box.height); }
    first = false;
  }

  addEventListener('scroll', update, { passive: true, signal: ac.signal });
  addEventListener('resize', () => { measure(); ScrollTrigger.refresh(); }, { signal: ac.signal });
  measure();
  document.fonts?.ready.then(() => { if (!ac.signal.aborted) { measure(); ScrollTrigger.refresh(); } });
  return () => { ac.abort(); gsap.killTweensOf(frame); };
}
