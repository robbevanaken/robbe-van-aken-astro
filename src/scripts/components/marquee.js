// Marquee: a constant loop that speeds up while scrolling (up or down) and eases back to its base speed.
// Hooks: [data-marquee] on the band, [data-marquee-track] on the row (content is doubled, so -50% loops seamlessly).
// Optional per band: data-marquee-speed (px per second, instead of half the track per 30 s) and data-marquee-boost
// (a share of the scroll boost, 1 = full).
import gsap from 'gsap';

const BASE = 1 / 30;   // base speed: half the track per 30 s
const BOOST = 0.012;   // extra speed per px/frame of scroll velocity
const MAX = 7;         // cap: at most 1 + MAX times the base speed

export function initMarquee(root = document) {
  const bands = [...root.querySelectorAll('[data-marquee]')];
  if (!bands.length) return null;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = bands.map((el) => ({ track: el.querySelector('[data-marquee-track]'), x: 0, half: 0, px: +el.dataset.marqueeSpeed || 0, boost: el.dataset.marqueeBoost ? +el.dataset.marqueeBoost : 1 }));
  const measure = () => items.forEach((m) => { m.half = m.track.scrollWidth / 2; });
  measure();
  addEventListener('resize', measure);
  document.fonts?.ready.then(measure);
  document.fonts?.addEventListener?.('loadingdone', measure); // a font that loads later (the blackletter band's)
  const off = () => { removeEventListener('resize', measure); document.fonts?.removeEventListener?.('loadingdone', measure); };
  if (reduce) return off;

  let lastY = scrollY, boost = 0;
  const tick = (time, dt) => {
    const v = Math.abs(scrollY - lastY) * (16.67 / Math.max(dt, 1)); // px per 60fps frame
    lastY = scrollY;
    const target = Math.min(v * BOOST * 60, MAX);
    boost += (target - boost) * (target > boost ? .25 : .05); // quick to speed up, slow to settle
    items.forEach((m) => {
      if (!m.half) return;
      const k = 1 + boost * m.boost, step = (dt / 1000) * (m.px ? m.px : BASE * m.half) * k;
      m.x = (m.x + step) % m.half;
      m.track.style.transform = `translate3d(${-m.x}px,0,0)`;
    });
  };
  gsap.ticker.add(tick);
  return () => { off(); gsap.ticker.remove(tick); };
}
