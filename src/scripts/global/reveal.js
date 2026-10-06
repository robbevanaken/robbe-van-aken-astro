// Adds .is-in to every [data-reveal] element once it scrolls into view. The CSS decides what that looks like.
// An IntersectionObserver for the normal case, plus a check on scroll for elements the visitor has jumped past
// (an element clipped to nothing by its own reveal style, clip-path, may never report as intersecting).
// Returns a cleanup function.
export function initReveal(root = document) {
  const els = [...root.querySelectorAll('[data-reveal]')];
  if (!els.length) return null;
  if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return null; }
  let left = els.slice();
  const show = (el) => { el.classList.add('is-in'); io.unobserve(el); left = left.filter((e) => e !== el); };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) show(e.target); });
  }, { rootMargin: '0px 0px -15% 0px' });
  els.forEach((el) => io.observe(el));
  let raf = 0;
  const check = () => {
    raf = 0;
    const line = innerHeight * .85;
    left.slice().forEach((el) => { if (el.getBoundingClientRect().top < line) show(el); });
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
  addEventListener('scroll', onScroll, { passive: true });
  check();
  return () => { io.disconnect(); removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
}
