// Highlight text on scroll (Osmo Supply "Highlight Text on Scroll"), kept as delivered.
// Only changes: npm imports instead of CDN scripts, one export instead of DOMContentLoaded, and nothing runs with prefers-reduced-motion.
//   data-highlight-text           the element to highlight letter by letter while scrolling
//   data-highlight-scroll-start   default "top 90%"
//   data-highlight-scroll-end     default "center 40%"
//   data-highlight-fade           opacity before highlight, default 0.2
//   data-highlight-stagger        default 0.1 (lower = smoother)
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText)

function initHighlightText(){

  let splitHeadingTargets = document.querySelectorAll("[data-highlight-text]")
  splitHeadingTargets.forEach((heading) => {

    const scrollStart = heading.getAttribute("data-highlight-scroll-start") || "top 90%"
    const scrollEnd = heading.getAttribute("data-highlight-scroll-end") || "center 40%"
    const fadedValue = heading.getAttribute("data-highlight-fade") || 0.2 // Opacity of letter
    const staggerValue =  heading.getAttribute("data-highlight-stagger") || 0.1 // Smoother reveal

    new SplitText(heading, {
      type: "words, chars",
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
    });
  });
}

// Initialize Highlight Text on Scroll (called from the page once fonts are ready)
export function initHighlight() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  initHighlightText();
}
