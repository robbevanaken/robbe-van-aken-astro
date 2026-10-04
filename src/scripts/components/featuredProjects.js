// Featured projects (home): the corner brackets on the project nearest the middle of the screen.
//   - focus: the project nearest the middle eases down a little (FOCUS), as if the brackets hold it
//   - frame: the corner brackets follow the project nearest the middle of the screen on a spring (image
//     and caption together); when
//     another project becomes the nearest they glide over to it, with a little overshoot, and lock on.
// Without a frame (/work's grid) it does nothing. Only runs while the section is on screen. prefers-reduced-motion: no
// focus, the brackets jump.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FOCUS = .04;  // scale the project in the brackets loses
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export function initFeaturedProjects(root = document) {
  const wrap = root.querySelector('[data-featured-projects]');
  if (!wrap) return null;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const frame = wrap.querySelector('[data-fp-frame]');
  const items = [...wrap.querySelectorAll('[data-fp-item]')];
  const cards = items.map((it) => it.querySelector('[data-fp-card]'));
  const media = cards.map((c) => c.querySelector('[data-fp-media]'));
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
    // the brackets: a spring towards the nearest project, image and caption; the one in the brackets a touch smaller
    if (!frame) return;
    if (!reduce) items.forEach((it, i) => {
      focus[i] += ((i === near ? 1 : 0) - focus[i]) * .08;
      cards[i].style.transform = focus[i] > .001 ? `scale(${(1 - FOCUS * focus[i]).toFixed(4)})` : '';
    });
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
