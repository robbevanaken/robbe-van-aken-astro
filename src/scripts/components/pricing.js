// What it costs (sections/Pricing.astro, [data-pricing]), desktop only — below 1024px the cards simply fade up in
// turn (data-reveal + _pricing.css). The section pins while the three cards fly in one by one, scrubbed: each comes
// up from below the fold with a throw of rotation and lands fanned beside the previous (slightly rotated, the outer
// cards a touch lower, later cards on top), like a hand of cards laid on the table. Once they all lie (progress .78)
// the stage gets .is-priced and the prices' digits roll up (the odometer columns in _pricing.css); scrolling back out
// re-arms the roll, so it plays again on the next pass.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initPricing(root = document) {
  const sec = root.querySelector('[data-pricing]');
  if (!sec || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(min-width: 1024px)').matches) return; // phones + tablet: data-reveal does the arrival
  const pin = sec.querySelector('[data-pricing-pin]');
  const cards = [...sec.querySelectorAll('[data-pricing-card]')];
  if (!pin || !cards.length) return;
  const THROW = [-12, 9, -14];        // the rotation each card arrives with…
  const LAID = [-4.5, .5, 5];         // …the slight fan it settles on…
  const DROP = [14, 0, 16];           // …and the outer cards' drop, so the row reads as a hand
  const tl = gsap.timeline({
    defaults: { ease: 'power2.out' },
    scrollTrigger: {
      trigger: pin, start: 'top top', end: 'bottom bottom', scrub: .8, invalidateOnRefresh: true,
      onUpdate: (self) => sec.classList.toggle('is-priced', self.progress > .78),
    },
  });
  cards.forEach((c, i) => tl.fromTo(c,
    { y: () => innerHeight * 1.1, rotation: THROW[i % THROW.length] },
    { y: DROP[i % DROP.length], rotation: LAID[i % LAID.length], duration: .34 }, i * .2));
  tl.to({}, { duration: .12 }); // the scrub holds the laid hand to the pin's end
  return () => {
    tl.scrollTrigger?.kill(); tl.kill();
    sec.classList.remove('is-priced');
    gsap.set(cards, { clearProps: 'transform' });
  };
}
