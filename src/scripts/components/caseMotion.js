// Scroll motion in a project's case study (sections/ProjectCase.astro), scrubbed with the scroll:
// - [data-case-scroll]: a window on a long page screenshot; the page scrolls inside it while the window crosses the
//   screen (top: entering at the bottom, bottom: leaving at the top).
// - [data-case-strip] / [data-case-strip-track]: a row of stills wider than the screen drifts left while the strip
//   crosses the screen, from its first still at the margin to its last one.
// - [data-case-parallax]: an image a touch larger than its box, sliding slowly against the scroll.
// Measured on refresh (resize, fonts). Reduced motion: nothing moves. Also: warms up the case's images (below).
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initCaseMotion(root = document) {
  // the case study's images load in the background once the page is in: the scroll windows' long pages first (the
  // heaviest), then the rest, so they're there by the time the visitor scrolls to them (lazy loading would only start
  // them a little before they come into view)
  const ac = new AbortController();
  const warm = () => {
    if (ac.signal.aborted) return;
    const imgs = [...root.querySelectorAll('[data-case-scroll] img'), ...root.querySelectorAll('.c-project-case img[loading="lazy"]')];
    imgs.forEach((img) => { img.loading = 'eager'; });
  };
  const idle = (fn) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 600));
  if (document.readyState === 'complete') idle(warm); else addEventListener('load', () => idle(warm), { once: true, signal: ac.signal });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => ac.abort();
  const tweens = [];
  root.querySelectorAll('[data-case-scroll]').forEach((win) => {
    const img = win.querySelector('img');
    if (!img) return;
    tweens.push(gsap.fromTo(img, { y: 0 }, {
      y: () => -Math.max(0, img.offsetHeight - win.offsetHeight), ease: 'none',
      scrollTrigger: { trigger: win, start: 'top 85%', end: 'bottom 15%', scrub: .6, invalidateOnRefresh: true },
    }));
    if (!img.complete) img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  });
  root.querySelectorAll('[data-case-strip]').forEach((strip) => {
    const track = strip.querySelector('[data-case-strip-track]');
    if (!track) return;
    tweens.push(gsap.fromTo(track, { x: 0 }, {
      x: () => -Math.max(0, track.scrollWidth - strip.offsetWidth), ease: 'none',
      scrollTrigger: { trigger: strip, start: 'top bottom', end: 'bottom top', scrub: .6, invalidateOnRefresh: true },
    }));
  });
  root.querySelectorAll('[data-case-parallax]').forEach((img) => {
    tweens.push(gsap.fromTo(img, { yPercent: -5, scale: 1.1 }, {
      yPercent: 5, scale: 1.1, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    }));
  });
  return () => { ac.abort(); tweens.forEach((t) => { t.scrollTrigger?.kill(); t.kill(); }); };
}

