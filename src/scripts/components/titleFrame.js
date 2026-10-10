// The corner brackets around a project's title (PageIntro `frame`, [data-title-frame]) come in the way they do on the
// buttons and project cards on hover (fading in while they slide the last bit outwards: the CSS in _page-intro.css),
// once the title is on screen: after the loader, a page swap, or the open-project / next-project arrivals, which fade
// the intro in themselves (so it waits until the title shows). Reduced motion: they're simply there.
const DELAY = 100; // ms after the title shows
const BUSY = ['is-loading', 'is-covered', 'is-transitioning'];

// is the element really showing: no page transition over it, and it and its parents (mostly) opaque
function showing(el) {
  if (BUSY.some((c) => document.documentElement.classList.contains(c))) return false;
  for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
    if (parseFloat(getComputedStyle(n).opacity) < .6) return false;
  }
  return true;
}

export function initTitleFrame(root = document) {
  const frame = root.querySelector('[data-title-frame]');
  if (!frame) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { frame.classList.add('is-in'); return; }
  let raf = 0, timer = 0;
  const wait = () => {
    if (!showing(frame.parentElement)) { raf = requestAnimationFrame(wait); return; }
    timer = setTimeout(() => frame.classList.add('is-in'), DELAY);
  };
  raf = requestAnimationFrame(wait);
  return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
}
