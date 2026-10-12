// The statement's video loops (ui/StatementLoop.astro, [data-statement-loop]): they load and play only while on
// screen and pause off it, so three loops never run (or download) for nothing. Reduced motion: never played, the
// poster stays.
export function initStatementLoops(root = document) {
  const boxes = [...root.querySelectorAll('[data-statement-loop]')];
  if (!boxes.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target.querySelector('video');
      if (e.isIntersecting) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause();
    }
  }, { rootMargin: '200px 0px' });
  boxes.forEach((b) => io.observe(b));
  return () => io.disconnect();
}
