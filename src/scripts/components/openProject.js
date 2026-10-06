// Card → project page (home's featured projects and /work, [data-fp-card]): the card's image grows into the project
// page's visual. Driven by global/pageTransitions.js ("open-project", instead of the default overlay):
//   leave(card)  old page: the image panel ([data-fp-media]) is lifted into a fixed copy at the same spot (in <body>,
//                outside #swup, so it survives the swap); the page fades out around it, the labels on the image go
//   prepare()    new page, before its first paint: everything that fades in is hidden, the visual too
//   enter(copy)  new page (at the top): the copy grows onto the visual ([data-project-media]), then crossfades into
//                it (the same image, cover-cropped to each box) while the header, the intro (staggered) and the rest
//                fade in. Snappy: .3s out, .85s grow (expo.inOut), .2s hand-over, .9s intro
// The R is never lost and doesn't move: it already sits small at the top centre (the projects' sticky head on home,
// the header on /work), exactly where the project page's header shows it. leave() holds it there (rIntro on a fixed
// stand-in box at that spot, so it stays put while the page fades; html.is-opening keeps its canvas above the image
// copy; when the header is scrolled away on /work it glides down into place, calmly); snap() covers the swap with a
// still until the new page's R has drawn (it carries on from the same particles); enter() hands it to the new header
// (same spot: no movement, no turn) once that has happened.
// Only transforms, opacity and the copy's box are animated; the copy is removed at the end.
import gsap from 'gsap';
import { rIntro } from '../r-journey/engine.js';

const swupEl = () => document.getElementById('swup');
// the page's R stays: everything else fades
const fadeTargets = () => [
  ...document.querySelectorAll('[data-site-header], #swup [data-r-canvas]:not([data-r-intro]), [data-page-intro] > *'),
  ...document.querySelectorAll('[data-project-visual] ~ *'),
];
const pageParts = () => [...swupEl().children].filter((el) => !el.matches('[data-r-intro]'));

// the R held at its spot: a fixed stand-in box on its anchor (#a-craft: the projects' head on home, the header on /work;
// a hidden header's offset is taken out, so it's the resting spot), rIntro on it (state 5: the same small R). Already
// there: held where it is. Out of view (/work scrolled down: the header, and the R with it, is hidden): the stand-in
// starts where the R is and glides down to the resting spot, calmly, instead of popping in; `glide` resolves when it's there.
let holder = null, glide = null, still = null, drawn = null;
function holdR() {
  const a = document.querySelector('#swup #a-craft');
  if (!a) return;
  const r = a.getBoundingClientRect(), header = a.closest('[data-site-header]');
  const dy = header ? header.getBoundingClientRect().top : 0;
  holder = document.createElement('div');
  Object.assign(holder.style, { position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, pointerEvents: 'none', visibility: 'hidden' });
  document.body.append(holder);
  gsap.killTweensOf(rIntro);
  rIntro.el = holder; rIntro.t = 1; rIntro.turn = 0;
  // the stand-in itself moves (it's outside #swup, so the glide runs on through the page swap)
  glide = dy < -1 ? new Promise((resolve) => gsap.to(holder, { top: r.top - dy, duration: 1, ease: 'power2.inOut', onComplete: resolve, onInterrupt: resolve })) : null;
}
function releaseR() {
  if (holder) gsap.killTweensOf(holder);
  if (rIntro.el === holder) { rIntro.t = 0; rIntro.el = null; }
  rIntro.onDraw = null;
  still?.remove(); still = null;
  holder?.remove(); holder = null; glide = null; drawn = null;
  document.documentElement.classList.remove('is-opening');
}

export const openProject = {
  async leave(card) {
    document.documentElement.classList.add('is-opening');
    holdR();
    const media = card?.querySelector('[data-fp-media]');
    if (!media) { await gsap.to(pageParts(), { autoAlpha: 0, duration: .4 }); return null; }
    const r = media.getBoundingClientRect(), copy = media.cloneNode(true);
    copy.removeAttribute('data-fp-media');
    copy.classList.add('c-featured-projects__media--carried');
    copy.setAttribute('aria-hidden', 'true');
    Object.assign(copy.style, { top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` });
    // keep the image's hover zoom on the copy (it's outside the card now), it eases back while the copy grows
    const img = media.querySelector('img'), cimg = copy.querySelector('img');
    if (img && cimg) { cimg.style.transform = getComputedStyle(img).transform; cimg.style.transition = 'none'; cimg.loading = 'eager'; cimg.src = img.currentSrc || img.src; }
    // the copy's image ready before it shows (a lazy copy would flash the colour placeholder for a few frames)
    if (cimg) await Promise.race([cimg.decode().catch(() => {}), new Promise((r) => setTimeout(r, 300))]);
    document.body.append(copy);
    await Promise.all([
      gsap.to(pageParts(), { autoAlpha: 0, duration: .3, ease: 'power2.out' }),
      gsap.to(copy.querySelectorAll('.c-featured-projects__tag'), { autoAlpha: 0, duration: .2 }),
    ]);
    return copy;
  },
  // just before the swap: a still of the R on top until the new page's R has drawn (its engine starts from the same
  // particles, so nothing jumps)
  snap() {
    const old = document.querySelector('#swup [data-r-intro]');
    if (!old?.width) return;
    still?.remove();
    still = document.createElement('canvas');
    still.width = old.width; still.height = old.height;
    still.getContext('2d').drawImage(old, 0, 0);
    Object.assign(still.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', zIndex: 96, pointerEvents: 'none' });
    still.setAttribute('aria-hidden', 'true');
    document.body.append(still);
    // gone as soon as the new page's R has drawn (or after .6s, never left behind): `drawn`
    const mine = still;
    drawn = new Promise((resolve) => {
      const done = () => { mine.remove(); if (still === mine) still = null; resolve(); };
      rIntro.onDraw = done;
      setTimeout(done, 600);
    });
  },
  prepare() {
    gsap.set([...fadeTargets(), ...document.querySelectorAll('[data-project-visual]')], { autoAlpha: 0 });
    gsap.set(swupEl(), { clearProps: 'opacity,visibility' });
  },
  async enter(copy) {
    const visual = document.querySelector('[data-project-visual]'), media = document.querySelector('[data-project-media]');
    const targets = fadeTargets();
    // the R: the new header's R sits on the same spot, so it simply takes over (no flight, no turn), once the new
    // page's R has drawn (the still is gone then: never two R's) and it has arrived, if it was gliding in
    const handed = Promise.all([drawn, glide]).then(releaseR);
    if (copy && media) {
      const r = media.getBoundingClientRect();
      await Promise.all([
        gsap.to(copy, { top: r.top, left: r.left, width: r.width, height: r.height, duration: .85, ease: 'expo.inOut' }),
        // the screenshot leaves the card's tag band and settles with the page's even margins, in step with the box
        copy.querySelector('[data-visual]') ? gsap.to(copy.querySelector('[data-visual]'), { '--visual-bare': 1, duration: .85, ease: 'expo.inOut' }) : null,
        copy.querySelector('img') ? gsap.to(copy.querySelector('img'), { scale: 1, duration: .85, ease: 'expo.inOut' }) : null,
        media.decode ? media.decode().catch(() => {}) : null,
      ]);
      gsap.set(visual, { autoAlpha: 1 });
      gsap.to(copy, { autoAlpha: 0, duration: .2, ease: 'power1.out', onComplete: () => copy.remove() }); // the same image: a soft hand-over
    } else {
      copy?.remove();
      gsap.set(visual, { clearProps: 'opacity,visibility' });
    }
    const intro = [...document.querySelectorAll('[data-page-intro] > *')];
    const rest = targets.filter((t) => !intro.includes(t));
    gsap.fromTo(intro, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .9, ease: 'expo.out', stagger: .08, clearProps: 'all' });
    await gsap.to(rest, { autoAlpha: 1, duration: .7, ease: 'power2.out', delay: .05, clearProps: 'opacity,visibility' });
    gsap.set(visual, { clearProps: 'opacity,visibility' });
    await handed;
  },
};
