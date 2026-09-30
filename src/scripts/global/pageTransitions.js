// Page loader + page transitions (swup). The whole page lives in the swup container (#swup, layouts/Base.astro); the
// veil ([data-transition], r-journey/veil.js), Lenis and the cookie consent live outside it and stay.
//   first load     the veil covers the page, the R dithers in while a counter runs to 100, then the veil bursts open
//   link clicks    the veil closes from the click, the R shimmers while the next page swaps in, then it opens again
//   next project   ([data-scroll-next-link], components/scrollNext.js) no veil: the next project's visual already sits
//                  where the new page shows it, so it's carried over and only the rest of the page fades in
// mount() runs every page script and returns their cleanups; unmount() runs just before the content is replaced.
// prefers-reduced-motion: no loader, instant swaps.
import Swup from 'swup';
import SwupHeadPlugin from '@swup/head-plugin';
import SwupPreloadPlugin from '@swup/preload-plugin';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLenis } from './lenis.js';
import { createVeil } from '../r-journey/veil.js';
import { handOff, arrive } from '../components/scrollNext.js';

gsap.registerPlugin(ScrollTrigger);

const LOADER_MIN = 1.3; // seconds the loader stays at least, so the R has time to build up
const LOADER_MAX = 6;   // never wait longer than this for images
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

function loadProgress(onProgress) {
  // fonts count for half, the images on the page for the rest
  const imgs = [...document.images].filter((i) => !i.complete && i.loading !== 'lazy');
  let done = 0, fonts = 0;
  const total = imgs.length;
  const report = () => onProgress(.5 * fonts + .5 * (total ? done / total : 1));
  imgs.forEach((i) => { const d = () => { done++; report(); }; i.addEventListener('load', d, { once: true }); i.addEventListener('error', d, { once: true }); });
  document.fonts.ready.then(() => { fonts = 1; report(); });
  report();
}

async function runLoader(el, veil) {
  const count = el.querySelector('[data-transition-count]');
  const shown = { v: 0 }, t0 = performance.now();
  let real = 0;
  veil.set(1, 0);
  el.classList.add('is-drawn');
  loadProgress((v) => { real = v; });
  const stopIdle = veil.idle();
  veil.showR(1.1);
  // the counter follows the real progress, but never faster than the minimum time allows
  await new Promise((resolve) => {
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      const cap = Math.min(1, t / LOADER_MIN), target = t > LOADER_MAX ? 1 : Math.min(real, cap);
      shown.v += (target - shown.v) * .12;
      if (target === 1 && 1 - shown.v < .004) shown.v = 1;
      count.textContent = String(Math.round(shown.v * 100)).padStart(3, '0');
      if (shown.v === 1) { gsap.ticker.remove(tick); resolve(); }
    };
    gsap.ticker.add(tick);
  });
  stopIdle();
  document.documentElement.classList.remove('is-loading');
  await veil.reveal();
  el.classList.remove('is-drawn');
}

export function initPageTransitions({ mount, unmount }) {
  const root = document.documentElement;
  const el = document.querySelector('[data-transition]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const veil = el && !reduce ? createVeil(el.querySelector('[data-transition-canvas]')) : null;

  mount();
  if (veil) runLoader(el, veil); else root.classList.remove('is-loading');

  // swup swaps pages at the top; don't let the browser restore old scroll positions on back/forward.
  // Set through ScrollTrigger: it re-applies its own remembered value ("auto") on every refresh otherwise.
  ScrollTrigger.clearScrollMemory('manual');
  swup = new Swup({
    containers: ['#swup'],
    animationSelector: false,
    plugins: [new SwupHeadPlugin({ awaitAssets: true }), new SwupPreloadPlugin()],
  });

  let pointer = null, carried = null;
  addEventListener('pointerdown', (e) => { pointer = { x: e.clientX, y: e.clientY }; }, { passive: true });

  swup.hooks.on('visit:start', (visit) => {
    if (visit.trigger.el?.closest('[data-scroll-next-link]')) visit.animation.name = 'next-project';
  });

  // no scrolling while a transition runs (trackpad momentum would move the new page away under the carried visual)
  swup.hooks.on('visit:start', () => getLenis()?.stop());
  swup.hooks.on('visit:end', () => getLenis()?.start());

  swup.hooks.replace('animation:out:await', async (visit) => {
    if (visit.animation.name === 'next-project') { carried = handOff(); return; }
    if (!veil) return;
    el.classList.add('is-drawn');
    await veil.cover(visit.trigger.el ? pointer || undefined : undefined);
  });

  swup.hooks.before('content:replace', () => {
    unmount();
    ScrollTrigger.getAll().forEach((t) => t.kill());
  });
  swup.hooks.replace('content:scroll', (visit) => {
    scrollTop();
    const hash = visit.to.hash && document.getElementById(decodeURIComponent(visit.to.hash.slice(1)));
    if (hash) getLenis() ? getLenis().scrollTo(hash, { immediate: true }) : hash.scrollIntoView();
  });
  swup.hooks.on('content:scroll', (visit) => {
    mount();
    // hide what fades in on arrival before the first paint
    if (visit.animation.name === 'next-project') arrive.prepare();
  });
  // links to an anchor on the current page: let Lenis scroll there smoothly
  swup.hooks.replace('scroll:anchor', (visit, { hash }) => {
    const target = document.getElementById(decodeURIComponent(hash.replace(/^#/, '')));
    if (!target) return false;
    const lenis = getLenis();
    lenis ? lenis.scrollTo(target) : target.scrollIntoView({ behavior: 'smooth' });
    return true;
  });

  swup.hooks.replace('animation:in:await', async (visit) => {
    if (visit.animation.name === 'next-project') { await arrive.play(carried); carried = null; return; }
    if (!veil) return;
    await veil.reveal();
    el.classList.remove('is-drawn');
  });
  swup.hooks.on('page:view', () => ScrollTrigger.refresh());
}
