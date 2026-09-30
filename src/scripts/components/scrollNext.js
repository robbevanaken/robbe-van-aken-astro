// Scroll to next page (Osmo Supply "Scroll to Next Page"), kept as delivered where possible.
// Changes, to fit the site: npm imports; our progress shape is a horizontal line instead of a circle (same
// [data-scroll-next-path] stroke-draw); the corner brackets close in around the title ([data-scroll-next-frame]);
// the link fires after a real downward scroll once the line is 99% full (so coming back with the back button,
// page restored at the bottom, doesn't bounce you straight to the next project again; the scroll has to come from
// the visitor: wheel, touch or keys in the last moment).
// Seamless hand-off: in the second half the full-screen visual shrinks to exactly the box the next project's page
// shows it in at the top (measured with a hidden copy of this page's intro filled with the next project's text),
// so when the page swaps (global/pageTransitions.js) the visual is carried over and only the rest fades in.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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
  put('[data-page-intro-label]', wrap.dataset.nextLabel);
  put('[data-page-intro-title]', wrap.dataset.nextTitle);
  put('[data-page-intro-text]', wrap.dataset.nextIntro);
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
  const path = wrap.querySelector("[data-scroll-next-path]");
  const box = wrap.querySelector("[data-scroll-next-box]");
  const bg = wrap.querySelector("[data-scroll-next-bg]");
  const word = wrap.querySelector("[data-scroll-next-word]");
  const overlay = wrap.querySelector("[data-scroll-next-overlay]");
  const frame = wrap.querySelector("[data-scroll-next-frame]");
  const progress = wrap.querySelector("[data-scroll-next-progress]");

  if (!link || !path) return null;

  // ScrollTrigger defaults
  const start = wrap.getAttribute("data-scroll-start") || "top top";
  const end = wrap.getAttribute("data-scroll-end") || "bottom bottom";

  // Prep SVG path for line draw animation
  const pathLength = path.getTotalLength();

  gsap.set(path, {
    strokeDasharray: pathLength,
    strokeDashoffset: pathLength,
  });

  // only follow the link after the visitor has scrolled down into the section themselves,
  // and go as soon as the line is (nearly) full: smooth scrolling eases into the bottom and may never land on exactly 100%
  let armed = false, gone = false, input = 0;
  const ac = new AbortController();
  const touched = () => { input = performance.now(); };
  ['wheel', 'touchmove', 'keydown'].forEach((t) => addEventListener(t, touched, { passive: true, signal: ac.signal }));
  const go = () => { if (gone) return; gone = true; link.click(); };
  const onUpdate = (self) => {
    if (self.direction > 0 && performance.now() - input < 1500) armed = true;
    if (armed && self.progress >= 0.99) go();
  };

  // target box of the visual on the next page (re-measured on every refresh)
  let target = null;
  const measure = () => { target = measureTarget(root, wrap); };
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

  // the timeline runs 0 → 1 over the whole scroll
  tl.to(path, {
    strokeDashoffset: 0,
    duration: 1,
    onComplete: () => {
      if (armed) go();
    }
  });

  // Optional bg scale (settles at 1 so it matches the next page)
  if (bg) {
    tl.fromTo(bg, { scale: 1.15 }, { scale: 1, duration: 1 }, 0);
  }

 // Optional dark overlay animation: darker while the title is up, gone by the end (the next page has no overlay)
  if (overlay) {
    tl.to(overlay, { opacity: 0.5, duration: 0.4 }, 0).to(overlay, { opacity: 0, duration: 0.5 }, 0.5);
  }

  // Our addition: the corner brackets close in from wide around the title to tight, then the title makes way
  if (frame) {
    tl.fromTo(frame, { '--pull-x': '-18vw', '--pull-y': '-14vh' }, { '--pull-x': '0px', '--pull-y': '0px', duration: 0.5 }, 0);
    tl.to(frame, { autoAlpha: 0, y: -24, duration: 0.25 }, 0.5);
  }
  if (progress) tl.to(progress, { autoAlpha: 0, duration: 0.08 }, 0.92);

  // Our addition: the visual shrinks from full screen to its box on the next page
  if (box && target) {
    const inner = link;
    tl.fromTo(box,
      { top: 0, left: 0, width: () => inner.clientWidth, height: () => inner.clientHeight },
      { top: () => target.y, left: () => target.x, width: () => target.w, height: () => target.h, duration: 0.55, ease: 'power2.inOut' },
      0.45);
    if (word) tl.fromTo(word, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.7);
  }

  return () => { ac.abort(); tl.scrollTrigger?.kill(); };
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
  copy.querySelector('[data-scroll-next-overlay]')?.remove();
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
