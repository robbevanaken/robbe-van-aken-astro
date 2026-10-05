// Scroll to next page (based on Osmo Supply "Scroll to Next Page").
// Changes, to fit the site: npm imports; no progress shape and no full-screen visual: the next project's visual starts
// two columns narrower than on its page, partly below the fold, right after the content ([data-scroll-next-slot]);
// the link fires after a real downward scroll once the scroll is 99% through (so coming back with the back button,
// page restored at the bottom, doesn't bounce you straight to the next project again; the scroll has to come from
// the visitor: wheel, touch or keys in the last moment).
// Seamless hand-off: the visual rises and grows into exactly the box the next project's page
// shows it in at the top (measured with a hidden copy of this page's intro filled with the next project's text),
// so when the page swaps (global/pageTransitions.js) the visual is carried over and only the rest fades in.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollToY, easeInOut } from '../global/lenis.js';

gsap.registerPlugin(ScrollTrigger);

// Where the next project's visual sits on its own page, scrolled to the top: this page's intro + visual, cloned
// off screen with the next project's texts (both pages use the same template).
function measureTarget(root, wrap) {
  const intro = root.querySelector('[data-page-intro]'), visual = root.querySelector('[data-project-visual]');
  if (!intro || !visual) return null;
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;top:0;left:0;width:100%;visibility:hidden;pointer-events:none';
  probe.setAttribute('aria-hidden', 'true');
  probe.inert = true;
  const i = intro.cloneNode(true), v = visual.cloneNode(true);
  const put = (sel, text) => { const n = i.querySelector(sel); if (n && text != null) n.textContent = text; };
  put('[data-page-intro-title]', wrap.dataset.nextTitle);
  put('[data-page-intro-service]', wrap.dataset.nextService);
  probe.append(i, v);
  document.body.append(probe);
  const r = v.querySelector('[data-project-media]').getBoundingClientRect();
  const out = { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
  probe.remove();
  return out;
}

function initScrollToNextPage(root) {
  const wrap = root.querySelector("[data-scroll-next-wrap]");

  if (!wrap) return null;

  const link = wrap.querySelector("[data-scroll-next-link]");
  const box = wrap.querySelector("[data-scroll-next-box]");
  const bg = wrap.querySelector("[data-scroll-next-bg]");
  const word = wrap.querySelector("[data-scroll-next-word]");
  const slot = wrap.querySelector("[data-scroll-next-slot]");
  const stage = slot?.parentElement;

  if (!link) return null;

  // ScrollTrigger defaults
  const start = wrap.getAttribute("data-scroll-start") || "top top";
  const end = wrap.getAttribute("data-scroll-end") || "bottom bottom";


  // only follow the link after the visitor has scrolled down into the section themselves,
  // and go as soon as the line is (nearly) full: smooth scrolling eases into the bottom and may never land on exactly 100%
  let armed = false, gone = false, input = 0;
  const ac = new AbortController();
  const touched = () => { input = performance.now(); };
  ['wheel', 'touchmove', 'keydown'].forEach((t) => addEventListener(t, touched, { passive: true, signal: ac.signal }));
  const go = () => { if (gone) return; gone = true; link.click(); };
  // magnet: past MAGNET, stopping on the way down (after scrolling yourself) glides on to the end, which
  // opens the next project; scrolling on yourself simply carries on
  const MAGNET = .42;
  let rest = 0;
  const magnet = (self) => {
    clearTimeout(rest);
    rest = setTimeout(() => {
      if (!armed || gone || self.direction < 0 || self.progress < MAGNET || self.progress >= .99) return; // not when heading back up
      if (performance.now() - input < 150) return magnet(self); // still on the wheel / finger down: wait
      // a soft start after the stop, no sudden pull
      scrollToY(self.end, .6 + (1 - self.progress) * 1.4, easeInOut);
    }, 180);
  };
  const onUpdate = (self) => {
    if (self.direction > 0 && performance.now() - input < 1500) armed = true;
    if (armed && self.progress >= 0.99) go();
    else magnet(self);
  };

  // target box of the visual on the next page (re-measured on every refresh)
  let target = null;
  const measure = () => {
    target = measureTarget(root, wrap);
    // how far down the sticky stage starts: the section is pulled up by that much (CSS --lead), so the label follows the
    // content after a normal gap
    if (stage) wrap.style.setProperty('--lead', stage.getBoundingClientRect().top - link.getBoundingClientRect().top + 'px');
  };
  measure();

  const tl = gsap.timeline({
    defaults: {
      ease: "none",
    },
    scrollTrigger: {
      id: 'scroll-next',
      trigger: wrap,
      start,
      end,
      scrub: true,
      onUpdate,
      invalidateOnRefresh: true,
      onRefreshInit: measure,
    },
  });

  // the timeline runs 0 → 1 over the whole (pinned) scroll: the visual rises from partly below the fold and grows into
  // its box on the next page
  tl.to({}, { duration: 1 }, 0);
  tl.add(() => { if (armed) go(); }, 1);

  // the visual starts on its slot (relative to the sticky stage) and ends on the next page's box
  const slotBox = () => {
    const r = slot.getBoundingClientRect(), i = link.getBoundingClientRect();
    return { x: r.left - i.left, y: r.top - i.top, w: r.width, h: r.height };
  };
  const endBox = () => target || slotBox();
  if (box && slot) {
    tl.fromTo(box,
      { top: () => slotBox().y, left: () => slotBox().x, width: () => slotBox().w, height: () => slotBox().h },
      { top: () => endBox().y, left: () => endBox().x, width: () => endBox().w, height: () => endBox().h, duration: 1, ease: 'power2.inOut' },
      0);
  }
  // a slow settle of the image inside its box (ends at 1, as on the next page)
  if (bg) tl.fromTo(bg, { scale: 1.15 }, { scale: 1, duration: 1 }, 0);
  if (word) tl.fromTo(word, { autoAlpha: 0 }, { autoAlpha: 1, duration: .25 }, .75);
  // page furniture just above the section (the "All projects" button): fades out as the rising visual comes up to it
  // (over the last 48px), so it never travels up past the visual, and stays clickable until then
  const fades = [...root.querySelectorAll('[data-scroll-next-fade]')];
  const fade = () => {
    if (!box || !fades.length) return;
    const top = box.getBoundingClientRect().top;
    fades.forEach((el) => {
      const o = Math.min(1, Math.max(0, (top - el.getBoundingClientRect().bottom) / 48));
      el.style.opacity = o.toFixed(3); el.style.visibility = o < .02 ? 'hidden' : '';
    });
  };
  addEventListener('scroll', fade, { passive: true, signal: ac.signal });
  fade();

  return () => { ac.abort(); clearTimeout(rest); tl.scrollTrigger?.kill(); };
}

export function initScrollNext(root = document) {
  const kill = initScrollToNextPage(root);
  if (!kill) return null;
  // text reveals split lines once fonts are in, which can change the page height: re-measure
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  // coming back via the back/forward cache: allow the link to fire again on the next scroll-through
  const onShow = (e) => { if (e.persisted) location.reload(); };
  addEventListener('pageshow', onShow);
  return () => { kill(); removeEventListener('pageshow', onShow); };
}

// Page swap, step 1 (old page): lift the visual out of the page into a fixed copy at the same spot, on top of
// everything but the header, so it survives the content swap.
export function handOff() {
  const box = document.querySelector('[data-scroll-next-box]');
  if (!box) return null;
  const r = box.getBoundingClientRect(), copy = box.cloneNode(true);
  copy.removeAttribute('data-scroll-next-box');
  copy.classList.add('c-scroll-next__bg--carried');
  Object.assign(copy.style, { top: r.top + 'px', left: r.left + 'px', width: r.width + 'px', height: r.height + 'px' });
  document.body.append(copy);
  return copy;
}

// Page swap, step 2 (new page, scrolled to the top): the copy glides onto the real visual (normally it's already
// there), then disappears on top of it while the header, intro and the rest of the page fade in.
const fadeTargets = () => [
  ...document.querySelectorAll('[data-site-header], [data-r-canvas], [data-page-intro] > *'),
  ...[...document.querySelectorAll('[data-project-visual] ~ *')],
];
export const arrive = {
  prepare() { gsap.set(fadeTargets(), { autoAlpha: 0 }); },
  async play(copy) {
    const targets = fadeTargets(), media = document.querySelector('[data-project-media]');
    gsap.set(targets, { autoAlpha: 0 });
    if (copy && media) {
      const r = media.getBoundingClientRect();
      await Promise.all([
        gsap.to(copy, { top: r.top, left: r.left, width: r.width, height: r.height, duration: .5, ease: 'power3.out' }),
        media.decode ? media.decode().catch(() => {}) : null,
      ]);
    }
    copy?.remove();
    const intro = [...document.querySelectorAll('[data-page-intro] > *')];
    const rest = targets.filter((t) => !intro.includes(t));
    gsap.fromTo(intro, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: .9, ease: 'expo.out', stagger: .08, clearProps: 'all' });
    await gsap.to(rest, { autoAlpha: 1, duration: .8, ease: 'power2.out', delay: .15, clearProps: 'opacity,visibility' });
  },
};
