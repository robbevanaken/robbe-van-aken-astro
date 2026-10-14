// Image preview cursor follower (Osmo Supply's "Image Preview Cursor Follower", its logic kept as delivered; wrapped in
// the site's mount / cleanup pattern): over a [data-follower-item] the item's [data-follower-visual] is cloned into the
// [data-follower-cursor] that trails the pointer, the old one sliding out and the new one in (down the list: from
// below, up: from above). sections/Projects.astro, styles in _work-list.css (the show / hide is CSS, fine pointers and
// 1024px+ only).
import gsap from 'gsap';

export function initPreviewFollower(root = document) {
  const wrappers = root.querySelectorAll('[data-follower-wrap]');
  if (!wrappers.length) return;
  const ac = new AbortController(), on = { signal: ac.signal };
  const calls = [];

  wrappers.forEach((wrap) => {
    const collection = wrap.querySelector('[data-follower-collection]');
    const items = wrap.querySelectorAll('[data-follower-item]');
    const follower = wrap.querySelector('[data-follower-cursor]');
    const followerInner = wrap.querySelector('[data-follower-cursor-inner]');
    if (!collection || !follower || !followerInner) return;

    let prevIndex = null;
    let firstEntry = true;

    const offset = 100; // The animation distance in %
    const duration = 0.5; // The animation duration of all visual transforms
    const ease = 'power2.inOut';

    gsap.set(follower, { xPercent: -50, yPercent: -50 });
    const xTo = gsap.quickTo(follower, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(follower, 'y', { duration: 0.6, ease: 'power3' });
    addEventListener('mousemove', (e) => { xTo(e.clientX); yTo(e.clientY); }, on);

    items.forEach((item, index) => {
      item.addEventListener('mouseenter', () => {
        const forward = prevIndex === null || index > prevIndex;
        prevIndex = index;
        follower.querySelectorAll('[data-follower-visual]').forEach((el) => {
          gsap.killTweensOf(el);
          gsap.to(el, { yPercent: forward ? -offset : offset, duration, ease, overwrite: 'auto', onComplete: () => el.remove() });
        });
        const visual = item.querySelector('[data-follower-visual]');
        if (!visual) return;
        const clone = visual.cloneNode(true);
        clone.querySelectorAll('img').forEach((img) => { img.loading = 'eager'; });
        followerInner.appendChild(clone);
        if (!firstEntry) gsap.fromTo(clone, { yPercent: forward ? offset : -offset }, { yPercent: 0, duration, ease, overwrite: 'auto' });
        else firstEntry = false;
      }, on);
      item.addEventListener('mouseleave', () => {
        const el = follower.querySelector('[data-follower-visual]');
        if (!el) return;
        gsap.killTweensOf(el);
        gsap.to(el, { yPercent: -offset, duration, ease, overwrite: 'auto', onComplete: () => el.remove() });
      }, on);
    });

    collection.addEventListener('mouseleave', () => {
      follower.querySelectorAll('[data-follower-visual]').forEach((el) => {
        gsap.killTweensOf(el);
        calls.push(gsap.delayedCall(duration, () => el.remove()));
      });
      firstEntry = true;
      prevIndex = null;
    }, on);
  });

  return () => {
    ac.abort();
    calls.forEach((c) => c.kill());
    root.querySelectorAll('[data-follower-cursor] [data-follower-visual]').forEach((el) => { gsap.killTweensOf(el); el.remove(); });
  };
}
