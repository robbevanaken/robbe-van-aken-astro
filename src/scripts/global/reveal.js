// Adds .is-in to every [data-reveal] element once it scrolls into view. The CSS decides what that looks like.
// Returns a cleanup function.
export function initReveal(root = document) {
  const els = root.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return null; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -15% 0px' });
  els.forEach((el) => io.observe(el));
  return () => io.disconnect();
}
