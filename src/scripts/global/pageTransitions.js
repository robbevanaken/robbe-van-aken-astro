// Page loader + page transitions (swup). The whole page lives in the swup container (#swup, layouts/Base.astro); the
// loader overlay with the four corner brackets ([data-transition], layout/PageTransition.astro), Lenis and the cookie consent
// live outside it and stay.
//   first load     the name is spelled out where the header shows it, the small R floats in the middle, the counter runs
//                  to 100 (bottom right) and the brackets close in from the container width to the two middle columns;
//                  then they open out again and the page appears (the name stays put, the header's own sits beneath;
//                  the R is the page's own: it flies from the loader into the hero on home, the header elsewhere)
//   default        the page fades out, the next one is swapped in at the top and fades in
//   next project   ([data-scroll-next-link], components/scrollNext.js) the next project's visual already sits where
//                  the new page shows it, so it's carried over and only the rest fades in
// mount() starts every page script, unmount() runs their cleanups just before the content is replaced.
// prefers-reduced-motion: no loader, instant swaps.
import Swup from 'swup';
import SwupHeadPlugin from '@swup/head-plugin';
import SwupPreloadPlugin from '@swup/preload-plugin';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLenis } from './lenis.js';
import { handOff, arrive } from '../components/scrollNext.js';
import { rIntro } from '../r-journey/engine.js';

gsap.registerPlugin(ScrollTrigger);

const LOADER_MIN = 1.4; // seconds the loader stays at least, so the name can be spelled out
const LOADER_MAX = 6;   // never wait longer than this for fonts and images
const FADE_OUT = .4, FADE_IN = .6; // page swaps
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
  const loader = overlay.querySelector('[data-loader]');
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
  return { frame, loader, edges, closed };
}

// -----------------------------------------
// LOADER (first load)
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

async function runLoader(overlay, f) {
  const root = document.documentElement, bg = overlay.querySelector('[data-transition-bg]');
  const chars = overlay.querySelectorAll('[data-loader-char]'), count = overlay.querySelector('[data-loader-count]');
  const brand = overlay.querySelector('[data-loader-brand]');
  getLenis()?.stop();
  const from = f.edges(), to = f.closed();
  gsap.set(f.frame, { ...from, autoAlpha: 1 });
  // spell out the name, then the role
  gsap.to(chars, { opacity: 1, duration: .5, ease: 'power2.out', stagger: .03, delay: .15 });
  // the page's own R floats in the middle (its canvas is above the overlay while loading, _transition.css)
  rIntro.el = overlay.querySelector('[data-loader-r]');
  rIntro.t = 1;

  // the counter follows the real progress, never faster than the minimum time allows; the brackets close in with it
  let real = 0;
  loadProgress((v) => { real = v; });
  const t0 = performance.now(), shown = { v: 0 };
  await new Promise((resolve) => {
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      const target = t > LOADER_MAX ? 1 : Math.min(real, t / LOADER_MIN, 1);
      shown.v += (target - shown.v) * .1;
      if (target === 1 && 1 - shown.v < .004) shown.v = 1;
      count.textContent = String(Math.round(shown.v * 100)).padStart(3, '0');
      // the brackets are closed by 60% and wait there for the counter
      const e = 1 - Math.pow(1 - Math.min(1, shown.v / .6), 3);
      gsap.set(f.frame, { width: from.width + (to.width - from.width) * e, height: from.height + (to.height - from.height) * e });
      if (shown.v === 1) { gsap.ticker.remove(tick); resolve(); }
    };
    gsap.ticker.add(tick);
  });

  // out: the counter goes, the brackets open out again while the page appears behind them; the name fades with the
  // background, so it seems to stay (the header shows it in the same place). The R flies from the middle to its place
  // on the page, with a full turn (home: grows into the hero R, subpages: into the header).
  await gsap.timeline({ delay: .2 })
    .to(count, { autoAlpha: 0, duration: .3, ease: 'power1.in' })
    .to(f.frame, { ...f.edges(), duration: .9, ease: 'expo.inOut' }, .1)
    .to(rIntro, { t: 0, duration: 1.3, ease: 'expo.inOut' }, .1)
    .to([bg, brand], { opacity: 0, duration: .7, ease: 'power2.inOut' }, .35)
    .to(f.frame, { autoAlpha: 0, duration: .35, ease: 'power1.in' }, .75);
  rIntro.el = null;
  root.classList.remove('is-loading');
  gsap.set([f.loader, bg, brand, count], { clearProps: 'all' });
  getLenis()?.start();
}

// -----------------------------------------
// SWUP
// -----------------------------------------

export function initPageTransitions({ mount, unmount }) {
  const overlay = document.querySelector('[data-transition]');
  const f = overlay && !reducedMotion ? createFrame(overlay) : null;
  const fades = (visit) => visit.animation.name !== 'next-project' && !reducedMotion;

  mount();
  if (f && document.documentElement.classList.contains('is-loading')) runLoader(overlay, f);
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

  let carried = null;

  swup.hooks.on('visit:start', (visit) => {
    if (visit.trigger.el?.closest('[data-scroll-next-link]')) visit.animation.name = 'next-project';
    // no scrolling while a transition runs
    getLenis()?.stop();
  });

  swup.hooks.replace('animation:out:await', async (visit) => {
    if (visit.animation.name === 'next-project') { carried = handOff(); return; }
    if (fades(visit)) await gsap.to(page(), { autoAlpha: 0, duration: FADE_OUT, ease: 'power2.inOut' });
  });

  swup.hooks.before('content:replace', () => {
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
    else if (fades(visit)) gsap.set(page(), { autoAlpha: 0 });
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
    if (fades(visit)) await gsap.to(page(), { autoAlpha: 1, duration: FADE_IN, ease: 'power2.out', clearProps: 'opacity,visibility' });
  });

  swup.hooks.on('visit:end', () => {
    getLenis()?.start();
    getLenis()?.resize();
    ScrollTrigger.refresh();
  });
}
