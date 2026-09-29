// Scroll to next page (Osmo Supply "Scroll to Next Page"), kept as delivered where possible.
// Changes, to fit the site: npm imports; our progress shape is a horizontal line instead of a circle (same
// [data-scroll-next-path] stroke-draw); the corner brackets close in around the title ([data-scroll-next-frame]);
// the link only fires after a real downward scroll, so coming back with the browser's back button
// (page restored at the bottom) doesn't bounce you straight to the next project again.
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

  // only follow the link after the visitor has scrolled down into the section themselves
  let armed = false;
  const arm = () => { if (ScrollTrigger.getById?.('scroll-next')?.direction > 0) armed = true; };

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
      onUpdate: arm,
    },
  });

  tl.to(path, {
    strokeDashoffset: 0,
    onComplete: () => {
      if (armed) link.click();
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
}
