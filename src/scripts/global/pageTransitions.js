// Page loader + page transitions (swup). The whole page lives in the swup container (#swup, layouts/Base.astro); the
// loader overlay with the four corner brackets ([data-transition], layout/PageTransition.astro), Lenis and the cookie consent
// live outside it and stay.
//   first load     the name is spelled out where the header shows it, the small R floats in the middle, the counter runs
//                  to 100 (bottom right) and the brackets close in from the container width to the two middle columns;
//                  then they open out again and the page appears (the name stays put, the header's own sits beneath;
//                  the R is the page's own: it flies from the loader into the hero on home, the header elsewhere)
//   default        the same overlay with only the R and the counter: the background covers the page, the R flies to
//                  the middle and the counter (bottom right) runs to 50 while the next page loads; after the swap it
//                  runs on to 100 with the new page's fonts + images, then the background fades and the R flies to its
//                  place on the new page. The swap (the heaviest moment: old page out, page scripts in) waits until
//                  the R is at rest in the middle (rIntro.drift), so it can't make the R stutter; the new page's R goes
//                  on from the old one's particles and mouse turn (engine.js) and a still of the old R
//                  ([data-loader-r-snap]) covers the frame in between. While the overlay is opaque the page beneath
//                  isn't painted (html.is-covered).
//   next project   ([data-scroll-next-link], components/scrollNext.js) the next project's visual already sits where
//                  the new page shows it, so it's carried over and only the rest fades in
//   open project   (a project card, [data-fp-card], components/openProject.js) the card's image is lifted out, the
//                  page fades around it, then it grows onto the project page's visual while the new page fades in
// mount() starts every page script, unmount() runs their cleanups just before the content is replaced.
// prefers-reduced-motion: no loader, instant swaps.
import Swup from 'swup';
import SwupHeadPlugin from '@swup/head-plugin';
import SwupPreloadPlugin from '@swup/preload-plugin';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLenis } from './lenis.js';
import { handOff, arrive } from '../components/scrollNext.js';
import { openProject } from '../components/openProject.js';
import { rIntro } from '../r-journey/engine.js';

gsap.registerPlugin(ScrollTrigger);

const LOADER_MIN = 1.1; // seconds the loader stays at least, so the name can be spelled out
const LOADER_MAX = 6;   // never wait longer than this for fonts and images
const COVER = .4;       // page swaps: seconds for the counter's first half (while the next page loads)
const SWAP_MIN = .15;   // page swaps: seconds at least for the counter's second half
const REST_MAX = .5;    // page swaps: wait at most this long for the R to come to rest before the old page goes
const TRAVEL = .75;     // page swaps from the mobile menu: seconds for the R's way from the menu's corner to the middle

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let swup = null;

// Use for programmatic navigation (falls back to a normal page load)
export function navigate(url) {
  if (swup) swup.navigate(url); else location.href = url;
}

function scrollTop() {
  ScrollTrigger.clearScrollMemory(); // or its refresh puts the old page's scroll position back
  const lenis = getLenis();
  if (lenis) { lenis.scrollTo(0, { immediate: true, force: true }); lenis.resize(); }
  window.scrollTo(0, 0);
}

const page = () => document.querySelector('#swup');

// -----------------------------------------
// THE FRAME (four corner brackets)
// -----------------------------------------

function createFrame(overlay) {
  const frame = overlay.querySelector('[data-transition-frame]');
  const loader = overlay.querySelector('[data-loader]'), count = overlay.querySelector('[data-loader-count]');
  const bg = overlay.querySelector('[data-transition-bg]'), anchor = overlay.querySelector('[data-loader-r]');
  const snap = overlay.querySelector('[data-loader-r-snap]'), chars = overlay.querySelectorAll('[data-loader-char]');
  const ruler = overlay.querySelector('[data-loader-ruler]'), brand = overlay.querySelector('[data-loader-brand]');
  // open: the container width (page margin to page margin); vertically one gutter clear of the name (and, mirrored,
  // of the counter)
  const edges = () => {
    const grid = ruler.parentElement, cs = getComputedStyle(grid);
    const top = brand.getBoundingClientRect().bottom + parseFloat(cs.columnGap);
    return { width: grid.clientWidth - 2 * parseFloat(cs.paddingLeft), height: innerHeight - 2 * top };
  };
  // closed: a square on the two middle columns
  const closed = () => ({ width: ruler.offsetWidth, height: ruler.offsetWidth });
  return { frame, loader, count, bg, anchor, snap, chars, brand, edges, closed };
}

// -----------------------------------------
// THE COUNTER
// -----------------------------------------

// fonts count for half, the images on the page for the rest
function loadProgress(onProgress) {
  const imgs = [...document.images].filter((i) => !i.complete && i.loading !== 'lazy');
  let done = 0, fonts = 0;
  const report = () => onProgress(.5 * fonts + .5 * (imgs.length ? done / imgs.length : 1));
  imgs.forEach((i) => { const d = () => { done++; report(); }; i.addEventListener('load', d, { once: true }); i.addEventListener('error', d, { once: true }); });
  document.fonts.ready.then(() => { fonts = 1; report(); });
  report();
}

// a goal for the counter (0–1), from `base` to 1: follows the page's loading, never faster than `min` seconds, never
// longer than LOADER_MAX
function loadGoal(min, base = 0) {
  let real = 0;
  loadProgress((v) => { real = v; });
  const t0 = performance.now();
  return () => {
    const t = (performance.now() - t0) / 1000;
    return base + (1 - base) * (t > LOADER_MAX ? 1 : Math.min(real, t / min, 1));
  };
}

// the counter eases towards its goal (c.goal, swappable); with `brackets` the frame closes in with it (closed by 60%,
// then it waits there). c.done resolves at 100.
function startCounter(f, brackets, ease = .1) {
  const from = f.edges(), to = f.closed(), c = { goal: () => 0, shown: 0 };
  c.done = new Promise((resolve) => {
    const tick = () => {
      const g = Math.min(1, c.goal());
      c.shown += (g - c.shown) * ease;
      if (g === 1 && 1 - c.shown < .004) c.shown = 1;
      f.count.textContent = String(Math.round(c.shown * 100)).padStart(3, '0');
      if (brackets) {
        const e = 1 - Math.pow(1 - Math.min(1, c.shown / .6), 3);
        gsap.set(f.frame, { width: from.width + (to.width - from.width) * e, height: from.height + (to.height - from.height) * e });
      }
      if (c.shown === 1) { gsap.ticker.remove(tick); resolve(); }
    };
    gsap.ticker.add(tick);
  });
  return c;
}

// -----------------------------------------
// LOADER (first load)
// -----------------------------------------

async function runLoader(f) {
  getLenis()?.stop();
  gsap.set(f.frame, { ...f.edges(), autoAlpha: 1 });
  // spell out the name, then the role
  gsap.to(f.chars, { opacity: 1, duration: .5, ease: 'power2.out', stagger: .03, delay: .15 });
  // the page's own R floats in the middle (its canvas is above the overlay while loading, _transition.css)
  rIntro.el = f.anchor;
  rIntro.t = 1;
  rIntro.dark = true; // over the (always dark) overlay: dark colours, whatever the page's
  const c = startCounter(f, true);
  c.goal = loadGoal(LOADER_MIN);
  await c.done;

  // out: the counter goes, the brackets open out again while the page appears behind them; the name fades with the
  // background, so it seems to stay (the header shows it in the same place). The R flies from the middle to its place
  // on the page, with a full turn (home: grows into the hero R, subpages: into the header).
  await gsap.timeline({ delay: .2 })
    .to(f.count, { autoAlpha: 0, duration: .3, ease: 'power1.in' })
    .to(f.frame, { ...f.edges(), duration: .9, ease: 'expo.inOut' }, .1)
    .to(rIntro, { t: 0, duration: 1.3, ease: 'expo.inOut' }, .1)
    .to([f.bg, f.brand], { opacity: 0, duration: .7, ease: 'power2.inOut' }, .35)
    .to(f.frame, { autoAlpha: 0, duration: .35, ease: 'power1.in' }, .75);
  rIntro.el = null;
  rIntro.dark = false;
  try { sessionStorage.setItem('loaded', '1'); } catch {} // the next pages in this visit skip the loader (Base.astro)
  document.documentElement.classList.remove('is-loading');
  gsap.set([f.loader, f.bg, f.brand, f.count], { clearProps: 'all' });
  getLenis()?.start();
}

// -----------------------------------------
// PAGE SWAPS (only the R and the counter)
// -----------------------------------------

let swapCounter = null;

// first half: the background covers the page, the R flies to the middle, the counter runs to 50 (swup loads the next
// page meanwhile)
async function cover(f) {
  const root = document.documentElement;
  gsap.set([f.frame, f.brand], { autoAlpha: 0 });
  gsap.set(f.bg, { opacity: 0 });
  gsap.set(f.count, { autoAlpha: 0 });
  f.count.textContent = '000';
  root.classList.add('is-transitioning');
  rIntro.dark = true; // flying onto the (always dark) overlay
  // the style recalculation of showing the overlay lands in this frame, before anything moves
  await nextFrame();
  // the R already sits small in the mobile menu's corner (t is 1): it travels from there to the middle on a moving anchor
  // (a stand-in box gliding between the two), turning a full turn on the way, the same way round as into the menu
  if (rIntro.t > .99 && rIntro.el?.isConnected && !reducedMotion) travelR(rIntro.el, f.anchor, TRAVEL);
  else rIntro.el = f.anchor;
  const c = swapCounter = startCounter(f, false, .2), t0 = performance.now();
  c.goal = () => .5 * Math.min(1, (performance.now() - t0) / 1000 / COVER);
  await gsap.timeline()
    .to(f.bg, { opacity: 1, duration: .4, ease: 'power2.inOut' })
    .to(rIntro, { t: 1, duration: .55, ease: 'expo.inOut' }, 0)
    .to(f.count, { autoAlpha: 1, duration: .25, ease: 'power1.out' }, .1)
    .add(() => root.classList.add('is-covered'), .4);
  // the swap comes next and is heavy: only once the R is at rest
  const t1 = performance.now();
  while (rIntro.drift > 1.5 && performance.now() - t1 < REST_MAX * 1000) await nextFrame();
}

// the R from one anchor to another along the way: a fixed stand-in box glides from the first to the second (rIntro.el
// follows it, the springs on top keep it soft) while the R makes a full turn; then the real anchor takes over
function travelR(from, to, dur) {
  const a = from.getBoundingClientRect(), b = to.getBoundingClientRect(), box = document.createElement('div');
  Object.assign(box.style, { position: 'fixed', left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px`, pointerEvents: 'none', visibility: 'hidden' });
  document.body.append(box);
  rIntro.el = box;
  gsap.fromTo(rIntro, { turn: Math.PI * 2 }, { turn: 0, duration: dur, ease: 'power2.inOut' });
  gsap.to(box, { left: b.left, top: b.top, width: b.width, height: b.height, duration: dur, ease: 'power2.inOut',
    onComplete: () => { if (rIntro.el === box) rIntro.el = to; box.remove(); } });
}

// at the swap: a still of the old R stands in until the new page's R has drawn (its engine builds first)
function snapR(f) {
  const old = page().querySelector('[data-r-intro]');
  if (!old?.width) return;
  f.snap.width = old.width;
  f.snap.height = old.height;
  f.snap.getContext('2d').drawImage(old, 0, 0);
  gsap.set(f.snap, { autoAlpha: 1 });
  rIntro.onDraw = () => gsap.set(f.snap, { autoAlpha: 0 });
}

// second half, on the new page: the counter runs on to 100 with its fonts + images, then the background fades and the
// R flies to its place
async function uncover(f) {
  const c = swapCounter;
  swapCounter = null;
  c.goal = loadGoal(SWAP_MIN, .5);
  await c.done;
  document.documentElement.classList.remove('is-covered');
  await gsap.timeline({ delay: .05 })
    .to([f.count, f.snap], { autoAlpha: 0, duration: .2, ease: 'power1.in' })
    .to(rIntro, { t: 0, duration: .75, ease: 'expo.inOut' }, .05)
    .to(f.bg, { opacity: 0, duration: .45, ease: 'power2.inOut' }, .12);
  rIntro.el = null;
  rIntro.onDraw = null;
  rIntro.dark = false;
  document.documentElement.classList.remove('is-transitioning', 'is-covered');
  gsap.set([f.loader, f.bg, f.brand, f.count, f.snap, f.frame], { clearProps: 'all' });
}

// -----------------------------------------
// SWUP
// -----------------------------------------

export function initPageTransitions({ mount, unmount }) {
  const overlay = document.querySelector('[data-transition]');
  const f = overlay && !reducedMotion ? createFrame(overlay) : null;
  const shared = (visit) => visit.animation.name === 'next-project' || visit.animation.name === 'open-project';
  const covers = (visit) => f && !shared(visit);

  mount();
  if (f && document.documentElement.classList.contains('is-loading')) runLoader(f);
  else document.documentElement.classList.remove('is-loading');

  // swup swaps pages at the top; don't let the browser restore old scroll positions on back/forward.
  // Set through ScrollTrigger: it re-applies its own remembered value ("auto") on every refresh otherwise.
  ScrollTrigger.clearScrollMemory('manual');

  swup = new Swup({
    containers: ['#swup'],
    animationSelector: false,
    animateHistoryBrowsing: true,
    plugins: [new SwupHeadPlugin({ awaitAssets: true }), new SwupPreloadPlugin()],
  });

  let carried = null, card = null;

  swup.hooks.on('visit:start', (visit) => {
    if (visit.trigger.el?.closest('[data-scroll-next-link]')) visit.animation.name = 'next-project';
    else if (f && (card = visit.trigger.el?.closest('[data-fp-card]'))) visit.animation.name = 'open-project'; // f: not with reduced motion
    // no scrolling while a transition runs
    getLenis()?.stop();
  });

  swup.hooks.replace('animation:out:await', async (visit) => {
    if (visit.animation.name === 'next-project') { carried = handOff(); return; }
    if (visit.animation.name === 'open-project') { carried = await openProject.leave(card); card = null; return; }
    if (covers(visit)) await cover(f);
  });

  swup.hooks.before('content:replace', (visit) => {
    if (covers(visit)) snapR(f);
    if (visit.animation.name === 'open-project') openProject.snap();
    unmount();
    ScrollTrigger.getAll().forEach((t) => t.kill());
  });

  swup.hooks.replace('content:scroll', (visit) => {
    scrollTop();
    const hash = visit.to.hash && document.getElementById(decodeURIComponent(visit.to.hash.slice(1)));
    if (hash) getLenis() ? getLenis().scrollTo(hash, { immediate: true, force: true }) : hash.scrollIntoView();
  });
  swup.hooks.on('content:scroll', (visit) => {
    mount();
    // hide what fades in before the first paint
    if (visit.animation.name === 'next-project') arrive.prepare();
    if (visit.animation.name === 'open-project') openProject.prepare();
  });
  // links to an anchor on the current page: let Lenis scroll there smoothly
  swup.hooks.replace('scroll:anchor', (visit, { hash }) => {
    const target = document.getElementById(decodeURIComponent(hash.replace(/^#/, '')));
    if (!target) return false;
    const lenis = getLenis();
    lenis ? lenis.scrollTo(target) : target.scrollIntoView({ behavior: 'smooth' });
    target.focus({ preventScroll: true }); // the skip link (#top): keyboard focus moves along; no-op on non-focusable targets
    return true;
  });

  swup.hooks.replace('animation:in:await', async (visit) => {
    if (visit.animation.name === 'next-project') { await arrive.play(carried); carried = null; return; }
    if (visit.animation.name === 'open-project') { await openProject.enter(carried); carried = null; return; }
    if (covers(visit)) await uncover(f);
  });

  swup.hooks.on('visit:end', () => {
    getLenis()?.start();
    getLenis()?.resize();
    ScrollTrigger.refresh();
  });
}
