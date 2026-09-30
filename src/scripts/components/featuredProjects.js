// Featured projects: a pinned section where scrolling moves a continuous row of projects through a fixed "scope" frame.
// One smoothed value (cur = project index, fractional between projects) drives everything each frame:
//   - cards: position, scale and opacity from their distance to cur (neighbour rests on the .pnext column)
//   - images: a small horizontal parallax inside each card
//   - frame: breathes in between projects, locks back on when a project is centred
//   - caption: label scrambles to the new project, description cross-fades
// When scrolling stops between two projects it glides to the nearest one.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { scrollToY } from '../global/lenis.js';
import { navigate } from '../global/pageTransitions.js';

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);

const RATIO = 1.37; // image aspect (w/h) as in Figma; on short screens the image keeps its width and gets less tall
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (t) => t * t * (3 - 2 * t);
const pad = (n) => String(n).padStart(2, '0');

export function initFeaturedProjects(root = document) {
  const wrap = root.querySelector('[data-featured-projects]');
  if (!wrap) return null;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = wrap.querySelector('[data-fp-stage]'), frame = wrap.querySelector('[data-fp-frame]');
  const head = wrap.querySelector('[data-fp-head]'), foot = wrap.querySelector('[data-fp-foot]');
  const cards = [...wrap.querySelectorAll('[data-fp-card]')], imgs = cards.map((c) => c.querySelector('[data-fp-img]')), n = cards.length;
  const col1 = root.querySelector('[data-fp-ruler="col1"]'), col2 = root.querySelector('[data-fp-ruler="col2"]'), nextCol = root.querySelector('[data-fp-ruler="next"]');
  const capLink = wrap.querySelector('[data-fp-link]'), capT = wrap.querySelector('[data-fp-title]'), capD = wrap.querySelector('[data-fp-text]'), cnt = wrap.querySelector('[data-fp-count]');
  const PROJ = cards.map((c) => [c.dataset.title, c.dataset.desc, c.dataset.href]);

  let W = 0, H = 0, sm = .24, side = 0, step = 0;
  let cur = 0, last = -1, shown = 0;
  function dims() {
    const mob = innerWidth < 640, cx = document.documentElement.clientWidth / 2;
    // read the live grid from the rulers (col 1, col 2, last col)
    const c1 = col1.getBoundingClientRect(), c2 = col2.getBoundingClientRect();
    const colW = c1.width, gutter = c2.left - c1.right > 0 ? c2.left - c1.right : 12, margin = c1.left;
    const cols = parseInt(getComputedStyle(wrap).getPropertyValue('--cols'), 10) || 12;
    const maxW = document.documentElement.clientWidth - 2 * margin; // never wider than the content area
    // the image spans whole columns (6, or all 4 on phones), centred on the grid; the corner brackets sit one gutter outside it
    const spans = (cols >= 6 ? [6] : [4]);
    const spanW = (n) => Math.min(n * colW + (n - 1) * gutter, maxW);
    // the caption always spans the widest column span, so it keeps its width even when the image has to shrink
    wrap.style.setProperty('--mw', spanW(spans[0]) + 'px');
    // breathing room between the frame and the R above / the caption below (tighter on very short screens)
    const breath = innerHeight < 700 ? 12 : mob ? clamp(innerHeight * .06, 32, 64) : clamp(innerHeight * .05, 24, 56);
    stage.style.marginBlock = gutter + breath + 'px';
    const cs = getComputedStyle(wrap);
    const avail = Math.max(180, innerHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
      - head.offsetHeight - foot.offsetHeight - 2 * (gutter + breath));
    // the image always fills the full column span; on short screens only its height gives (object-fit: cover crops it)
    W = spanW(spans[0]);
    H = Math.max(160, Math.min(W / RATIO, avail));
    sm = mob ? .3 : .24;
    const smW = W * sm;
    side = Math.max(nextCol.getBoundingClientRect().left - cx + smW / 2, W / 2 + gutter * 2 + smW / 2);
    step = smW + gutter;
    cards.forEach((c) => { c.style.width = W + 'px'; c.style.height = H + 'px'; });
    stage.style.height = H + 'px';
    last = -1; // force a redraw
  }

  const st = ScrollTrigger.create({
    trigger: wrap, pin: true, start: 'top top',
    end: () => '+=' + Math.round(innerHeight * .85 * (n - 1)),
    invalidateOnRefresh: true, onRefreshInit: dims, onRefresh: dims,
  });

  function render() {
    const target = st.progress * (n - 1);
    cur = reduce ? target : cur + (target - cur) * .18;
    if (Math.abs(target - cur) < 1e-4) cur = target;
    if (cur === last) return;
    last = cur;

    cards.forEach((c, i) => {
      const d = i - cur, a = Math.abs(d), e = smooth(Math.min(a, 1));
      const x = Math.sign(d) * (a <= 1 ? e * side : side + (a - 1) * step);
      const s = 1 - (1 - sm) * e;
      c.style.transform = `translate3d(calc(-50% + ${x.toFixed(2)}px),-50%,0) scale(${s.toFixed(4)})`;
      c.style.opacity = (1 - .55 * e).toFixed(3);
      c.style.zIndex = a < .5 ? 2 : 1;
      if (!reduce) imgs[i].style.transform = `translate3d(${(clamp(d, -1.5, 1.5) * -7).toFixed(2)}%,0,0) scale(1.14)`;
    });

    // frame breathes in between projects (0 when a project is centred, 1 halfway)
    const f = cur - Math.floor(cur), bump = Math.sin(Math.PI * f);
    const fs = 1 - .12 * bump;
    frame.style.width = W * fs + 'px';
    frame.style.height = H * fs + 'px';

    // caption: description fades out towards the halfway point, swaps, fades back in
    const idx = clamp(Math.round(cur), 0, n - 1), dist = Math.abs(cur - idx);
    const o = 1 - smooth(clamp((dist - .08) / .3, 0, 1));
    capD.style.opacity = o.toFixed(3);
    capD.style.transform = `translate3d(0,${((1 - o) * 12).toFixed(2)}px,0)`;
    if (idx !== shown) {
      shown = idx;
      capD.textContent = PROJ[idx][1];
      capLink.href = PROJ[idx][2];
      cnt.textContent = pad(idx + 1);
      const text = pad(idx + 1) + ' — ' + PROJ[idx][0];
      if (reduce) capT.textContent = text;
      else gsap.to(capT, { duration: .7, overwrite: true, scrambleText: { text, chars: 'upperCase', speed: .9 } });
    }
  }
  dims();
  gsap.ticker.add(render);

  // settle: glide to the nearest project once scrolling stops in between
  const yFor = (i) => st.start + (st.end - st.start) * i / (n - 1);
  const settle = () => {
    if (!st.isActive) return;
    // direction-aware: a quarter of the way is enough to continue to the next project
    const p = st.progress * (n - 1), i = clamp(st.direction > 0 ? Math.floor(p + .75) : Math.ceil(p - .75), 0, n - 1);
    if (Math.abs(p - i) > .01) scrollToY(yFor(i), .8);
  };
  ScrollTrigger.addEventListener('scrollEnd', settle);
  // clicking a side project brings it into the frame, clicking the active one opens its page
  cards.forEach((c, i) => c.addEventListener('click', () => { if (i !== Math.round(cur)) scrollToY(yFor(i), 1.1); else navigate(c.dataset.href); }));

  return () => {
    gsap.ticker.remove(render);
    ScrollTrigger.removeEventListener('scrollEnd', settle);
    st.kill(true);
  };
}
