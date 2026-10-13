// Services (sections/Services.astro): the stage is pinned while [data-services-pin] scrolls on, one screen per service.
// serviceProgress() turns that scroll into 0 … n-1: whole numbers hold a service, fractions are the eased morph to the
// next one. The R engine reads it for the icon, initServices() for the text (it switches halfway through a morph).
// Hooks: [data-services] on the section, [data-services-pin] on the tall pin track, [data-service] on each item,
// Sets --sv (0 … n-1) and --p (0 → 1)
// on the section every frame for the desktop staircase and the R's slot (_services.css).
const HOLD = .3; // part of each screen at the start and at the end where the shape holds still (the morph: the 40% between)

// the count and the pin never change per section: cached (serviceProgress runs every engine frame and every scroll)
const geo = new WeakMap();
export function serviceProgress(el) {
  let sg = geo.get(el);
  if (!sg) geo.set(el, (sg = { n: el.querySelectorAll('[data-service]').length, pin: el.querySelector('[data-services-pin]') }));
  const n = sg.n, r = sg.pin.getBoundingClientRect();
  const run = r.height - innerHeight;
  if (n < 2 || run <= 0) return 0;
  const raw = Math.min(1, Math.max(0, -r.top / run)) * (n - 1), i = Math.min(Math.floor(raw), n - 2);
  const g = Math.min(1, Math.max(0, (raw - i - HOLD) / (1 - 2 * HOLD)));
  return i + g * g * (3 - 2 * g);
}

export function initServices(root = document) {
  const el = root.querySelector('[data-services]');
  if (!el) return null;
  const items = [...el.querySelectorAll('[data-service]')];
  const ac = new AbortController();
  let active = -1, shown = serviceProgress(el), target = shown, glide = 0;
  const n0 = items.length;
  const paint = () => { el.style.setProperty('--sv', shown.toFixed(4)); el.style.setProperty('--p', (n0 > 1 ? shown / (n0 - 1) : 0).toFixed(4)); };
  const step = () => {
    glide = 0;
    shown += (target - shown) * .14; // a soft follow: ~.4s to settle at 60fps
    if (Math.abs(target - shown) < .0005) shown = target; else glide = requestAnimationFrame(step);
    paint();
  };
  paint();
  const update = () => {
    const v = serviceProgress(el), a = Math.round(v), n = items.length;
    // the staircase, the card row and the R's slot follow the progress (_services.css), eased: they glide after the
    // scroll (--sv 0 … n-1, --p 0 → 1) instead of jumping with it
    target = v; if (!glide) glide = requestAnimationFrame(step);
    if (a === active) return;
    active = a;
    el.style.setProperty('--svc', a); // the count's number rolls (_services.css)
    items.forEach((it, i) => { it.classList.toggle('is-active', i === a); it.classList.toggle('is-past', i < a); });
  };
  // coalesced to one update per frame (Lenis fires a scroll event every frame while gliding)
  let raf = 0;
  const queue = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); };
  addEventListener('scroll', queue, { passive: true, signal: ac.signal });
  // desktop staircase: the step depth fits the screen — the shortest (last) panel must still hold the icon's room and
  // its content (on short screens the steps get shallower, never the content squeezed under the icon)
  const list = el.querySelector('.c-services__list'), wide = matchMedia('(min-width: 1024px)');
  const fitSteps = () => {
    if (!wide.matches || !list || items.length < 2) { el.style.removeProperty('--step'); return; }
    const need = Math.max(...items.map((it) => {
      const cs = getComputedStyle(it), kids = [...it.children];
      return parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.rowGap || cs.gap || 0) * (kids.length - 1)
        + kids.reduce((s, k) => s + k.offsetHeight + parseFloat(getComputedStyle(k).marginTop), 0);
    }));
    const step = Math.max(0, Math.min(innerHeight * .05, (list.clientHeight - need) / (items.length - 1)));
    el.style.setProperty('--step', `${step.toFixed(1)}px`);
  };
  fitSteps();
  document.fonts?.ready.then(() => { if (!ac.signal.aborted) fitSteps(); });
  addEventListener('resize', () => { fitSteps(); queue(); }, { signal: ac.signal });
  update();
  return () => { ac.abort(); cancelAnimationFrame(raf); cancelAnimationFrame(glide); };
}
