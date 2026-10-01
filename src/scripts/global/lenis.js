// Lenis smooth scroll, driven by the GSAP ticker so ScrollTrigger, the R engine and Lenis share one frame.
// Skipped for prefers-reduced-motion. Use scrollToY() for programmatic scrolls so they stay in sync.
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
let lenis = null;

export function initSmoothScroll() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, anchors: { offset: 0 } });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export function scrollToY(y, duration = 0.9, easing = easeOut) {
  if (lenis) lenis.scrollTo(y, { duration, easing });
  else window.scrollTo({ top: y, behavior: 'auto' });
}

export const getLenis = () => lenis;
