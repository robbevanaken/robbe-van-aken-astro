// Featured projects: the projects spread left and right down the page, bent over a globe as they pass.
//   - cards: each one tilts according to where it is on the screen, as if it lay on a sphere in front of you: flat in
//     the middle, turning away towards the top/bottom (around the horizontal axis) and the left/right (around the
//     vertical axis), a little smaller towards the edges. Measured on the untransformed list item, so the bend never
//     feeds back into itself.
//   - focus: the project nearest the middle eases down a little (FOCUS), as if the brackets hold it
//   - frame: the corner brackets follow the project nearest the middle of the screen on a spring (its bent box, image
//     and caption together); when
//     another project becomes the nearest they glide over to it, with a little overshoot, and lock on.
// Without a frame (/work's grid) only the bend runs. Only runs while the section is on screen. prefers-reduced-motion: no bend, the brackets jump.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TILT = 26;    // degrees at the screen's edge
const SHRINK = .1;  // scale lost at the screen's edge
const LENS = 1400;  // perspective (px) of each card
const FOCUS = .04;  // scale the project in the brackets loses
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export function initFeaturedProjects(root = document) {
  const wrap = root.querySelector('[data-featured-projects]');
  if (!wrap) return null;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const frame = wrap.querySelector('[data-fp-frame]');
  const items = [...wrap.querySelectorAll('[data-fp-item]')];
  const cards = items.map((it) => it.querySelector('[data-fp-card]'));
  const media = cards.map((c) => c.firstElementChild);
  if (!items.length) return null;

  // the frame spring (section coordinates)
  const fr = { x: 0, y: 0, w: 0, h: 0, vx: 0, vy: 0, vw: 0, vh: 0, on: false };
  const focus = items.map(() => 0), pos = items.map(() => null); // eased focus per card, this frame's screen position
  let active = false;

  function render() {
    if (!active) return;
    const vw = innerWidth, vh = innerHeight, cx = vw / 2, cy = vh / 2;
    let near = 0, best = Infinity;
    items.forEach((it, i) => {
      const r = it.getBoundingClientRect();
      if (r.bottom < -vh * .5 || r.top > vh * 1.5) { pos[i] = null; return; } // far off screen: leave it
      const mx = r.left + r.width / 2, my = r.top + Math.min(r.height, media[i].offsetHeight) / 2;
      const nx = clamp((mx - cx) / cx, -1.4, 1.4), ny = clamp((my - cy) / cy, -1.4, 1.4);
      pos[i] = { nx, ny };
      const dist = Math.hypot(nx * .6, ny);
      if (dist < best) { best = dist; near = i; }
    });
    if (!reduce) items.forEach((it, i) => {
      focus[i] += ((frame && i === near ? 1 : 0) - focus[i]) * .08;
      if (!pos[i]) return;
      // on a sphere: the right side faces right, the bottom faces down; the one in the brackets a touch smaller
      const { nx, ny } = pos[i], s = (1 - SHRINK * Math.min(nx * nx + ny * ny, 2)) * (1 - FOCUS * focus[i]);
      cards[i].style.transform = `perspective(${LENS}px) rotateX(${(-ny * TILT).toFixed(2)}deg) rotateY(${(nx * TILT).toFixed(2)}deg) scale(${s.toFixed(4)})`;
    });

    // the brackets: a spring towards the nearest project, image and caption (its bent box); /work has none
    if (!frame) return;
    const b = cards[near].getBoundingClientRect(), w0 = wrap.getBoundingClientRect();
    const t = { x: b.left - w0.left, y: b.top - w0.top, w: b.width, h: b.height };
    if (reduce || !fr.on) { Object.assign(fr, t, { vx: 0, vy: 0, vw: 0, vh: 0, on: true }); }
    else {
      const K = .07, D = .8; // stiffness, damping: lower K = slower, lower D = more overshoot
      for (const k of ['x', 'y', 'w', 'h']) { const v = 'v' + k; fr[v] = (fr[v] + (t[k] - fr[k]) * K) * D; fr[k] += fr[v]; }
    }
    frame.style.transform = `translate3d(${fr.x.toFixed(2)}px,${fr.y.toFixed(2)}px,0)`;
    frame.style.width = fr.w.toFixed(2) + 'px';
    frame.style.height = fr.h.toFixed(2) + 'px';
  }

  const st = ScrollTrigger.create({
    trigger: wrap, start: 'top bottom', end: 'bottom top',
    onToggle: (self) => { active = self.isActive; if (active) fr.on = false; },
  });
  active = st.isActive;
  gsap.ticker.add(render);

  return () => {
    gsap.ticker.remove(render);
    st.kill();
    cards.forEach((c) => { c.style.transform = ''; });
  };
}
