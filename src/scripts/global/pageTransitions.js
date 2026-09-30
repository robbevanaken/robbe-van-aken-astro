// Page transitions (swup). The whole page lives in the swup container (#swup, layouts/Base.astro); Lenis and the cookie
// consent live outside it and stay.
//   default        the page fades out, the next one is swapped in at the top and fades in
//   next project   ([data-scroll-next-link], components/scrollNext.js) the next project's visual already sits where
//                  the new page shows it, so it's carried over and only the rest fades in
// mount() starts every page script, unmount() runs their cleanups just before the content is replaced.
// prefers-reduced-motion: instant swaps.
import Swup from 'swup';
import SwupHeadPlugin from '@swup/head-plugin';
import SwupPreloadPlugin from '@swup/preload-plugin';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLenis } from './lenis.js';
import { handOff, arrive } from '../components/scrollNext.js';

gsap.registerPlugin(ScrollTrigger);

const FADE_OUT = .4, FADE_IN = .6;
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

export function initPageTransitions({ mount, unmount }) {
  mount();

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
  const fades = (visit) => visit.animation.name !== 'next-project' && !reducedMotion;

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
