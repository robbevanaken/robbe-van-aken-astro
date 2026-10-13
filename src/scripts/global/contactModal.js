// The contact popup (sections/ContactModal.astro), set up once (it lives outside #swup). Every link to /contact opens it
// instead of navigating (a capture listener, ahead of swup's); on the contact page itself (a direct visit) the inline
// script there sends JS visitors to /?contact, which opens it on load. While open: the page beside the header is inert,
// the page can't scroll (Lenis stopped, wheel / touch outside the panel blocked), the R canvases and fixed tiles step
// back (html.is-contact-open), and the header shows with "Contact" active (siteHeader.js listens to contact:open /
// contact:close). Closing: the close button, the backdrop, Escape, or any other link (the popup plays out while the
// page transition starts). Focus goes to the form's first field on open and back to the trigger on close.
import gsap from 'gsap';
import { getLenis } from './lenis.js';
import { rIntro } from '../r-journey/engine.js';
import { initContactForm } from '../components/contactForm.js';
import { initLocalTime } from '../components/localTime.js';

const OUT = 520; // the close animation (_contact-modal.css)

export function initContactModal() {
  const modal = document.querySelector('[data-contact-modal]');
  if (!modal) return;
  const panel = modal.querySelector('[data-contact-panel]'), scroller = modal.querySelector('[data-contact-scroll]');
  const bar = modal.querySelector('[data-contact-scrollbar]'), thumb = modal.querySelector('[data-contact-thumb]');
  const spot = modal.querySelector('[data-contact-r]'), phone = matchMedia('(max-width: 639px)');
  const FLY = .9; // s, the R's flight to / from its spot (as the menu's)
  const standIn = Object.assign(document.createElement('span'), { ariaHidden: 'true' });
  standIn.style.cssText = 'position:fixed;pointer-events:none;visibility:hidden';
  document.body.append(standIn);
  // the R from the menu's corner to the popup's spot: the stand-in glides there (in-out, a little slower than the
  // panel's reveal, so the R arrives as the panel settles), following the spot while the panel still moves
  const glideR = () => {
    const from = standIn.getBoundingClientRect(), p = { v: 0 };
    gsap.to(p, { v: 1, duration: 1.25, ease: 'power3.inOut', delay: .05, overwrite: true, // soft both ways (expo.inOut shot through the middle: it read as a jump)
      onUpdate: () => {
        const to = spot.getBoundingClientRect(), k = p.v, mix = (a, b) => `${a + (b - a) * k}px`;
        Object.assign(standIn.style, { left: mix(from.left, to.left), top: mix(from.top, to.top), width: mix(from.width, to.width), height: mix(from.height, to.height) });
      },
      onComplete: () => { if (rIntro.el === standIn) rIntro.el = spot; } });
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  initContactForm(modal);
  initLocalTime(modal);
  let open = false, trigger = null, timer = 0;
  // the custom scrollbar: a thumb sized and placed by the scroll (shown only when there is something to scroll)
  const sync = () => {
    const { scrollTop: st, scrollHeight: sh, clientHeight: ch } = scroller;
    const track = bar.clientHeight, on = sh > ch + 2;
    bar.classList.toggle('is-on', on);
    if (!on) return;
    const th = Math.max(32, track * ch / sh);
    thumb.style.setProperty('--th', `${th}px`);
    thumb.style.setProperty('--ty', `${(track - th) * st / (sh - ch)}px`);
  };
  scroller.addEventListener('scroll', sync, { passive: true });
  addEventListener('resize', sync);
  new ResizeObserver(sync).observe(modal.querySelector('.c-contact-modal__inner'));

  const isContact = (a) => a && a.origin === location.origin && a.pathname.replace(/\.html$/, '').replace(/\/$/, '') === '/contact' && !a.target;
  // everything next to the header (inside #swup) and the skip link
  const rest = () => {
    const swup = document.querySelector('#swup');
    return [...(swup ? swup.children : []), ...document.querySelectorAll('[data-skip-link]')].filter((el) => !el.matches('[data-site-header]'));
  };

  const show = (from) => {
    if (open) return;
    open = true; trigger = from || document.activeElement; openedAt = performance.now();
    clearTimeout(timer);
    const header = document.querySelector('[data-site-header]');
    modal.style.setProperty('--head', `${Math.round(header?.getBoundingClientRect().bottom || 110) + 8}px`);
    modal.hidden = false; modal.classList.remove('is-out');
    rest().forEach((el) => { el.inert = true; });
    document.documentElement.classList.add('is-contact-open');
    getLenis()?.stop();
    document.dispatchEvent(new CustomEvent('contact:open'));
    modal.classList.remove('is-prep');
    // phones: the page's R flies to its spot at the top of the panel (from the menu it's already handed over)
    if (phone.matches && spot && !reduce) {
      document.documentElement.classList.add('is-contact-r');
      if (rIntro.el === standIn) glideR();
      else if (rIntro.el !== spot) { rIntro.el = spot; gsap.to(rIntro, { t: 1, duration: FLY, ease: 'power4.out', overwrite: true }); }
    }
    requestAnimationFrame(() => requestAnimationFrame(() => { modal.classList.add('is-in'); sync(); }));
    // focus: the form's current field (typing can start at once), without scrolling the panel
    setTimeout(() => {
      const field = modal.querySelector('[data-contact-step].is-current input:not([type="hidden"]), [data-contact-step].is-current textarea');
      (field || scroller).focus({ preventScroll: true });
    }, reduce ? 0 : 450);
  };

  const hide = (returnFocus = true) => {
    if (!open) return;
    open = false;
    modal.classList.remove('is-in'); modal.classList.add('is-out');
    rest().forEach((el) => { el.inert = false; });
    document.documentElement.classList.remove('is-contact-open');
    getLenis()?.start();
    // focus back to the trigger FIRST: the nav tile follows focus, and the close signal after it must have the last
    // word, so the tile always returns to the page we're on (not to a refocused "Contact")
    if (returnFocus && trigger?.isConnected) trigger.focus({ preventScroll: true });
    document.dispatchEvent(new CustomEvent('contact:close'));
    let wait = reduce ? 0 : OUT;
    if (rIntro.el === standIn) rIntro.el = spot;
    if (rIntro.el === spot) {
      wait = Math.max(wait, FLY * 1000);
      gsap.to(rIntro, { t: 0, duration: FLY, ease: 'expo.inOut', overwrite: true,
        onComplete: () => { if (rIntro.el === spot) rIntro.el = null; document.documentElement.classList.remove('is-contact-r'); } });
    }
    timer = setTimeout(() => { if (!open) { modal.hidden = true; modal.classList.remove('is-out'); } }, wait);
  };

  // links: /contact opens it; any other link while it's open closes it and goes on (swup does the navigating)
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest?.('a[href]');
    if (isContact(a)) {
      e.preventDefault(); e.stopPropagation();
      // from the mobile menu: let it play out first
      if (document.documentElement.classList.contains('is-menu-open')) {
        // the R sits in the menu's corner: hand it straight to the popup's spot (the closing menu then leaves it be:
        // siteHeader.js only flies it home while it's still on the menu's anchor)
        if (phone.matches && spot && !reduce) {
          // a stand-in anchor on the menu's corner: the R stays put there while the menu plays out (and the closing
          // menu leaves it be), then glides to the popup's spot once the popup shows (glideR, in show)
          const corner = document.querySelector('[data-menu-r]')?.getBoundingClientRect();
          if (corner) Object.assign(standIn.style, { left: `${corner.left}px`, top: `${corner.top}px`, width: `${corner.width}px`, height: `${corner.height}px` });
          modal.hidden = false; modal.classList.add('is-prep');
          document.documentElement.classList.add('is-contact-r');
          gsap.killTweensOf(rIntro); rIntro.el = standIn; rIntro.t = 1;
        }
        document.querySelector('[data-menu-toggle]')?.click();
        setTimeout(() => show(a), reduce ? 0 : 420);
      } else show(a);
      return;
    }
    if (open && a && !modal.contains(a)) hide(false);
  }, true);
  modal.querySelectorAll('button[data-contact-close]').forEach((b) => b.addEventListener('click', () => hide()));
  // a press anywhere outside the panel closes it, the header's strip included (it lies above the veil, so the veil
  // never sees those clicks); the header's own links and buttons keep doing their thing (links close it on the way)
  // only a real tap outside closes it: pressed AND released outside the panel, barely moved, not right after opening
  // (on phones a press that turns into a scroll, the keyboard sliding up or the tap that opened it must never count)
  const inPanel = (e) => e.composedPath().includes(panel);
  let press = null, openedAt = 0;
  document.addEventListener('pointerdown', (e) => {
    press = open && !inPanel(e) && !e.target.closest?.('a, button') && performance.now() - openedAt > 450 ? { x: e.clientX, y: e.clientY } : null;
  }, true);
  document.addEventListener('pointerup', (e) => {
    const p = press; press = null;
    if (!p || !open || inPanel(e) || Math.hypot(e.clientX - p.x, e.clientY - p.y) > 10) return;
    hide();
  }, true);
  document.addEventListener('pointercancel', () => { press = null; }, true);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) hide(); });
  // the page behind never scrolls: wheel / touch outside the panel do nothing (the panel scrolls itself, contained)
  const block = (e) => { if (open && !scroller.contains(e.target)) e.preventDefault(); };
  modal.addEventListener('wheel', block, { passive: false });
  modal.addEventListener('touchmove', block, { passive: false });
  // back / forward (a page swap without a click) never leaves it open over the new page
  addEventListener('popstate', () => hide(false));

  // a direct visit to the contact page lands on /?contact (pages/contact.astro): open it there
  const params = new URLSearchParams(location.search);
  if (params.has('contact')) {
    params.delete('contact');
    history.replaceState(history.state, '', location.pathname + (params.size ? `?${params}` : '') + location.hash);
    const go = () => setTimeout(() => show(null), 300);
    if (document.documentElement.classList.contains('is-loading')) {
      const mo = new MutationObserver(() => { if (!document.documentElement.classList.contains('is-loading')) { mo.disconnect(); go(); } });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    } else go();
  }
  return { show, hide };
}
