// Scroll to next page (Osmo Supply "Scroll to Next Page"), kept as delivered where possible.
// Changes, to fit the site: npm imports; our progress shape is a horizontal line instead of a circle (same
// [data-scroll-next-path] stroke-draw); the corner brackets close in around the title ([data-scroll-next-frame]);
// the link fires after a real downward scroll once the line is 99% full (so coming back with the back button,
// page restored at the bottom, doesn't bounce you straight to the next project again).
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function initScrollToNextPage() {
  const wrap = document.querySelector("[data-scroll-next-wrap]");

  if (!wrap) return;

  const link = wrap.querySelector("[data-scroll-next-link]");
  const path = wrap.querySelector("[data-scroll-next-path]");
  const bg = wrap.querySelector("[data-scroll-next-bg]");
  const overlay = wrap.querySelector("[data-scroll-next-overlay]");
  const frame = wrap.querySelector("[data-scroll-next-frame]");

  if (!link || !path) return;

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
  let armed = false, gone = false;
  const go = () => { if (gone) return; gone = true; link.click(); };
  const onUpdate = (self) => {
    if (self.direction > 0) armed = true;
    if (armed && self.progress >= 0.99) go();
  };

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
    },
  });

  tl.to(path, {
    strokeDashoffset: 0,
    onComplete: () => {
      if (armed) go();
    }
  });

  // Optional bg scale
  if (bg) {
    tl.to(bg, { scale: 1.2 }, 0);
  }

 // Optional dark overlay animation
  if (overlay) {
    tl.to(overlay, { opacity: 0.5 }, 0);
  }

  // Our addition: the corner brackets close in from wide around the title to tight
  if (frame) {
    tl.fromTo(frame, { '--pull-x': '-18vw', '--pull-y': '-14vh' }, { '--pull-x': '0px', '--pull-y': '0px' }, 0);
  }
}

export function initScrollNext() {
  initScrollToNextPage();
  // text reveals split lines once fonts are in, which can change the page height: re-measure
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  // coming back via the back/forward cache: allow the link to fire again on the next scroll-through
  addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });
}
