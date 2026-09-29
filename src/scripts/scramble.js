// Text scramble (Osmo Supply "Text Scramble: Load, Scroll, Hover"), kept as delivered.
// Only changes: npm imports instead of CDN scripts, one init() export, and nothing runs with prefers-reduced-motion.
//   data-scramble="load"    reveal on page load
//   data-scramble="scroll"  reveal when scrolled into view (add data-scramble-alt for ▯| characters)
//   data-scramble-hover="link" on the hover area + data-scramble-hover="target" on the text (optional data-scramble-text)
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin, SplitText);

// Function to reveal stuff on load
function initScrambleOnLoad(){
  let targets = document.querySelectorAll('[data-scramble="load"]')

  targets.forEach((target) => {
      // split into seperate words + letters
    let split = new SplitText(target, {
      type: "words, chars",
      wordsClass: "word",
      charsClass: "char"
    });

    gsap.to(split.words, {
      duration: 1.2,
      stagger: 0.01,
      scrambleText: {
        text: "{original}",
        chars: 'upperCase', // experiment with different scramble characters here
        speed: 0.85,
      },
      // Once animation is done, revert the split to reduce DOM size
      onComplete: () => split.revert()
    });
  });
}

// Function to reveal stuff on scroll
function initScrambleOnScroll(){
  let targets = document.querySelectorAll('[data-scramble="scroll"]')

  targets.forEach((target) => {
      // Used this attribute to showcase a different character scramble, can be replaced with many scenarios
    let isAlternative = target.hasAttribute("data-scramble-alt")

    let split = new SplitText(target, {
      type: "words, chars",
      wordsClass: "word",
      charsClass: "char"
    });

    gsap.to(split.words, {
      duration: 1.4,
      stagger: 0.015,
      scrambleText: {
        text: "{original}",
        chars: isAlternative ? '▯|' : 'upperCase',  // experiment with different scramble characters here
        speed: 0.95,
      },
      scrollTrigger: {
        trigger: target,
        start: "top bottom",
        once: true
      },
      // Once animation is done, revert the split to reduce DOM size
      onComplete: () => split.revert()
    });
  });
}

function initScrambleOnHover(){
  let targets = document.querySelectorAll('[data-scramble-hover="link"]')

  targets.forEach((target) => {
    let textEl = target.querySelector('[data-scramble-hover="target"]')
    let originalText = textEl.textContent // save original text
    let customHoverText = textEl.getAttribute("data-scramble-text") // if this attribute is present, take a custom hover text

    let split = new SplitText(textEl, {
      type: "words, chars",
      wordsClass: "word",
      charsClass: "char"
    });

    target.addEventListener("mouseenter", () => {
      gsap.to(textEl, {
        duration: 1,
        scrambleText: {
          text: customHoverText ? customHoverText : originalText,
          chars: "◊▯∆|"
        }
      });
    });

    target.addEventListener("mouseleave", () => {
      gsap.to(textEl, {
        duration: 0.6,
        scrambleText: {
          text: originalText,
          speed: 2,
          chars: "◊▯∆"
        }
      });
    });
  });
}

// Initialize Scramble Functions (called from the page once fonts are ready, so SplitText measures the real font)
export function initScramble() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  initScrambleOnLoad();
  initScrambleOnScroll();
  initScrambleOnHover();
}
