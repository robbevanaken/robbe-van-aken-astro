// Highlight text on scroll (Osmo Supply "Highlight Text on Scroll"), kept as delivered.
// Only changes: npm imports instead of CDN scripts, one export instead of DOMContentLoaded, nothing runs with prefers-reduced-motion,
// it takes a root and returns a cleanup function (page swaps), and accessibility: SplitText's default puts an aria-label on
// the element, which isn't allowed on a <p>, so the split text is hidden from screen readers instead (aria: "hidden") and
// a visually hidden copy of the text sits right before it.
//   data-highlight-text           the element to highlight letter by letter while scrolling
//   data-highlight-scroll-start   default "top 90%"
//   data-highlight-scroll-end     default "center 40%"
//   data-highlight-fade           opacity before highlight, default 0.2
//   data-highlight-stagger        default 0.1 (lower = smoother)
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText)

function initHighlightText(root){

  const splits = [], copies = []

  let splitHeadingTargets = root.querySelectorAll("[data-highlight-text]")
  splitHeadingTargets.forEach((heading) => {

    const scrollStart = heading.getAttribute("data-highlight-scroll-start") || "top 90%"
    const scrollEnd = heading.getAttribute("data-highlight-scroll-end") || "center 40%"
    const fadedValue = heading.getAttribute("data-highlight-fade") || 0.2 // Opacity of letter
    const staggerValue =  heading.getAttribute("data-highlight-stagger") || 0.1 // Smoother reveal

    const copy = document.createElement(heading.tagName)
    copy.className = "u-sr-only"
    copy.textContent = heading.textContent.trim()
    heading.before(copy)
    copies.push(copy)

    splits.push(new SplitText(heading, {
      type: "words, chars",
      aria: "hidden",
      autoSplit: true,
      onSplit(self) {
        let ctx = gsap.context(() => {
          let tl = gsap.timeline({
            scrollTrigger: {
              scrub: true,
              trigger: heading,
              start: scrollStart,
              end: scrollEnd,
            }
          })
          tl.from(self.chars,{
            autoAlpha: fadedValue,
            stagger: staggerValue,
            ease: "linear"
          })
        });
        return ctx; // return our animations so GSAP can clean them up when onSplit fires
      }
    }));
  });

  return () => { splits.forEach((s) => s.revert()); copies.forEach((c) => c.remove()) }
}

// Initialize Highlight Text on Scroll (called from main.js once fonts are ready)
export function initHighlight(root = document) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  return initHighlightText(root);
}
