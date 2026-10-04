// Card → project page (home's featured projects and /work, [data-fp-card]): the card's image grows into the project
// page's visual. Driven by global/pageTransitions.js ("open-project", instead of the default overlay):
//   leave(card)  old page: the image panel ([data-fp-media]) is lifted into a fixed copy at the same spot (in <body>,
//                outside #swup, so it survives the swap); the page fades out around it, the labels on the image go
//   prepare()    new page, before its first paint: everything that fades in is hidden, the visual too
//   enter(copy)  new page (at the top): the copy grows onto the visual ([data-project-media]), then crossfades into
//                it (the same image, cover-cropped to each box) while the header, the intro (staggered) and the rest
//                fade in. Snappy: .3s out, .85s grow (expo.inOut), .2s hand-over, .9s intro
// Only transforms, opacity and the copy's box are animated; the copy is removed at the end.
import gsap from 'gsap';

const swupEl = () => document.getElementById('swup');
const fadeTargets = () => [
  ...document.querySelectorAll('[data-site-header], #swup [data-r-canvas], [data-page-intro] > *'),
  ...document.querySelectorAll('[data-project-visual] ~ *'),
];

export const openProject = {
  async leave(card) {
    const media = card?.querySelector('[data-fp-media]');
    if (!media) { await gsap.to(swupEl(), { autoAlpha: 0, duration: .4 }); return null; }
    const r = media.getBoundingClientRect(), copy = media.cloneNode(true);
    copy.removeAttribute('data-fp-media');
    copy.classList.add('c-featured-projects__media--carried');
    copy.setAttribute('aria-hidden', 'true');
    Object.assign(copy.style, { top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` });
    // keep the image's hover zoom on the copy (it's outside the card now), it eases back while the copy grows
    const img = media.querySelector('img'), cimg = copy.querySelector('img');
    if (img && cimg) { cimg.style.transform = getComputedStyle(img).transform; cimg.style.transition = 'none'; }
    document.body.append(copy);
    await Promise.all([
      gsap.to(swupEl(), { autoAlpha: 0, duration: .3, ease: 'power2.out' }),
      gsap.to(copy.querySelectorAll('.c-featured-projects__tag'), { autoAlpha: 0, duration: .2 }),
    ]);
    return copy;
  },
  prepare() {
    gsap.set([...fadeTargets(), ...document.querySelectorAll('[data-project-visual]')], { autoAlpha: 0 });
    gsap.set(swupEl(), { clearProps: 'opacity,visibility' });
  },
  async enter(copy) {
    const visual = document.querySelector('[data-project-visual]'), media = document.querySelector('[data-project-media]');
    const targets = fadeTargets();
    if (copy && media) {
      const r = media.getBoundingClientRect();
      await Promise.all([
        gsap.to(copy, { top: r.top, left: r.left, width: r.width, height: r.height, duration: .85, ease: 'expo.inOut' }),
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
  },
};
