// Masked text reveal (Osmo Supply's "Masked Text Reveal", GSAP SplitText): every [data-split="heading"] is split into
// lines, each line wrapped in its own mask (overflow hidden), and the lines slide up out of it in turn (expo.out).
// Here: the project detail's opening statement — the title and the intro (PageIntro `case`) as ONE cascade, the
// intro's lines following the title's. It plays once the page shows: after the loader (html.is-loading), a page swap
// (whenUncovered in main.js) and the fonts; the open-project arrival fades the intro's blocks in around it.
// `data-split-reveal`: lines (default) | words | chars, as in the resource. autoSplit re-splits on resize.
// FOUC: hidden in CSS until split (_page-intro.css, `.is-split` shows it); reduced motion / no JS: just there.
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

const splitConfig = {
  lines: { duration: 0.8, stagger: 0.08 },
  words: { duration: 0.6, stagger: 0.06 },
  chars: { duration: 0.4, stagger: 0.01 },
};

// resolves once the first-visit loader has gone (the overlay hides the page while html.is-loading is on)
// (and the page swap's overlay: html.is-covered — the reveal played under it and the text was simply
// there when it lifted)
const covered = (h) => h.classList.contains('is-loading') || h.classList.contains('is-covered'); // (is-covered lifts as the overlay starts to fade: the lines rise as it goes)
const whenLoaded = () => {
  const html = document.documentElement;
  if (!covered(html)) return Promise.resolve();
  return new Promise((resolve) => {
    const mo = new MutationObserver(() => { if (!covered(html)) { mo.disconnect(); resolve(); } });
    mo.observe(html, { attributes: true, attributeFilter: ['class'] });
  });
};

// the page arrivals (open-project, next-project) hold the reveal (html.is-intro-held, set in pageTransitions.js at
// visit:start) and release it the moment they show the intro, so the lines rise in view, one by one, as on a reload
export const releaseIntro = () => {
  const html = document.documentElement;
  if (!html.classList.contains('is-intro-held')) return;
  html.classList.remove('is-intro-held');
  document.dispatchEvent(new Event('intro:reveal'));
};
const whenReleased = () => (document.documentElement.classList.contains('is-intro-held')
  ? new Promise((resolve) => document.addEventListener('intro:reveal', resolve, { once: true }))
  : Promise.resolve());

export function initMaskReveal(root = document) {
  const headings = [...root.querySelectorAll('[data-split="heading"]')];
  if (!headings.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { headings.forEach((h) => h.classList.add('is-split')); return; }
  let alive = true;
  const splits = [];
  // the fonts first: a split before they're in is re-split when they land, mid-reveal (the lines then just appeared)
  const fonts = document.fonts?.ready ?? Promise.resolve();
  whenLoaded().then(whenReleased).then(() => fonts).then(() => {
    if (!alive) return;
    // one cascade across the headings in document order: each starts where the previous one's lines left off
    let at = 0.1;
    headings.forEach((heading) => {
      const type = heading.dataset.splitReveal || 'lines';
      const typesToSplit = type === 'lines' ? ['lines'] : type === 'words' ? ['lines', 'words'] : ['lines', 'words', 'chars'];
      const delay = at;
      let first = true, t0 = 0, total = 0;
      splits.push(SplitText.create(heading, {
        type: typesToSplit.join(', '),
        mask: 'lines',
        autoSplit: true,
        linesClass: 'line',
        wordsClass: 'word',
        charsClass: 'letter',
        onSplit(instance) {
          const targets = instance[type], config = splitConfig[type];
          heading.classList.add('is-split');
          // a re-split (a resize, a late font) after the reveal: just show it; DURING the reveal: play it on from where it
          // is, so the lines never pop in (Oct 2026: they sometimes appeared at once)
          const tween = (d) => gsap.fromTo(targets, { yPercent: 110 }, { yPercent: 0, duration: config.duration, stagger: config.stagger, ease: 'expo.out', delay: d });
          if (!first) { const left = total - (performance.now() - t0) / 1000; return left > 0 ? tween(Math.max(0, delay - (performance.now() - t0) / 1000)) : gsap.set(targets, { yPercent: 0 }); }
          first = false; t0 = performance.now(); total = delay + config.duration + (targets.length - 1) * config.stagger;
          at = Math.max(at, delay + (targets.length - 1) * config.stagger + 0.1);
          return tween(delay);
        },
      }));
      // the next heading follows this one's lines (counted on the first split)
      at = Math.max(at, delay + 0.16);
    });
  });
  return () => { alive = false; splits.forEach((s) => s.revert()); headings.forEach((h) => h.classList.remove('is-split')); };
}
