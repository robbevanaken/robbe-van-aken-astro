// Services (sections/Services.astro): the stage is pinned while [data-services-pin] scrolls on, one screen per service.
// serviceProgress() turns that scroll into 0 … n-1: whole numbers hold a service, fractions are the eased morph to the
// next one. The R engine reads it for the icon, initServices() for the text (it switches halfway through a morph).
// Hooks: [data-services] on the section, [data-services-pin] on the tall pin track, [data-service] on each item,
// [data-services-bar] on each progress segment (below 1024px; its --fill goes 0 → 1 as its service comes in).
const HOLD = .3; // part of each screen at the start and at the end where the shape holds still (the morph: the 40% between)

export function serviceProgress(el) {
  const n = el.querySelectorAll('[data-service]').length, r = el.querySelector('[data-services-pin]').getBoundingClientRect();
  const run = r.height - innerHeight;
  if (n < 2 || run <= 0) return 0;
  const raw = Math.min(1, Math.max(0, -r.top / run)) * (n - 1), i = Math.min(Math.floor(raw), n - 2);
  const g = Math.min(1, Math.max(0, (raw - i - HOLD) / (1 - 2 * HOLD)));
  return i + g * g * (3 - 2 * g);
}

export function initServices(root = document) {
  const el = root.querySelector('[data-services]');
  if (!el) return null;
  const items = [...el.querySelectorAll('[data-service]')], bars = [...el.querySelectorAll('[data-services-bar]')];
  const ac = new AbortController();
  let active = -1;
  const update = () => {
    const v = serviceProgress(el), a = Math.round(v);
    bars.forEach((b, i) => b.style.setProperty('--fill', Math.min(1, Math.max(0, v - i + 1)).toFixed(3)));
    if (a === active) return;
    active = a;
    items.forEach((it, i) => { it.classList.toggle('is-active', i === a); it.classList.toggle('is-past', i < a); });
  };
  addEventListener('scroll', update, { passive: true, signal: ac.signal });
  addEventListener('resize', update, { signal: ac.signal });
  update();
  return () => ac.abort();
}
