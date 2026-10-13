// Light sound, synthesised with WebAudio (no files): a soft paper tick (a pinch of noise) when the pointer enters
// anything interactive, and the R's morphs as GLINTS — tiny bright sine blips, like pixels catching the light: a
// clearly different material from the hover's paper, so the two never blur (tried: noise grains for the R too) (rAudio in
// r-journey/engine.js: stage flights with their turn, the services' icon morphs, the loader / menu flights — never
// the mouse sway or sitting still). The harder the morph, the denser and slightly louder the grains; parked, the R is
// silent. The page loads silent, and the visit's FIRST click — wherever it lands — switches the sound on (that click
// is also the gesture browsers demand before audio may play, so it works from that very click); the tile can switch
// it off again, and that choice sticks — nothing is remembered across loads (page swaps keep it: swup never
// reloads). Runs once (outside #swup); the hover listener is delegated.
import { rAudio } from '../r-journey/engine.js';

let ctx = null, master = null, grainBuf = null, raf = 0, acc = 0, lastTick = 0;
let on = false; // off by default, per visit only

const make = () => {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = .5; master.connect(ctx.destination);
  // one short decaying noise burst, reused for every grain (pitch varies per grain)
  const n = 1400, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
  grainBuf = buf;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    const v = rAudio.v; rAudio.v *= .9; // read and decay
    if (!on || ctx.state !== 'running' || v < .015) { acc = 0; return; }
    acc += Math.min(1.4, v * 1.3); // grains per frame: density follows the morph
    while (acc >= 1) { acc -= 1; grain(v); }
  };
  loop();
};

// one glint: a tiny bright sine blip, randomly pitched high (brighter still as the morph intensifies), a fast
// exponential decay, placed a little left or right
const grain = (v) => {
  const t = ctx.currentTime, dur = .03 + Math.random() * .035;
  const osc = ctx.createOscillator(); osc.type = 'sine';
  osc.frequency.value = 2600 + v * 1400 + Math.random() * 4800;
  const g = ctx.createGain();
  const peak = (.007 + .016 * Math.min(1, v)) * (.75 + Math.random() * .5);
  g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(.0004, t + dur);
  let out = g;
  if (ctx.createStereoPanner) { const pan = ctx.createStereoPanner(); pan.pan.value = (Math.random() * 2 - 1) * .5; g.connect(pan); out = pan; }
  osc.connect(g); out.connect(master);
  osc.start(t); osc.stop(t + dur + .01);
  osc.onended = () => { osc.disconnect(); g.disconnect(); out !== g && out.disconnect(); };
};

// a soft paper tick on entering anything interactive
const tick = () => {
  if (!ctx || !on || ctx.state !== 'running') return;
  const now = performance.now();
  if (now - lastTick < 70) return; // never a machine gun
  lastTick = now;
  const src = ctx.createBufferSource(); src.buffer = grainBuf; src.playbackRate.value = 1.2 + Math.random() * .4;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 1.1;
  const g = ctx.createGain(); g.gain.value = .05;
  src.connect(bp); bp.connect(g); g.connect(master);
  src.start(); src.onended = () => { src.disconnect(); bp.disconnect(); g.disconnect(); };
};

const sync = (btn) => {
  btn?.setAttribute('aria-pressed', String(on));
  btn?.classList.toggle('is-off', !on);
};

export function initSound() {
  const btn = document.querySelector('[data-sound-toggle]');
  sync(btn);
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest?.('a,button,input,select,textarea,label,[data-menu-toggle]');
      if (t && !t.contains(e.relatedTarget) && t !== e.relatedTarget?.closest?.('a,button,input,select,textarea,label,[data-menu-toggle]')) tick();
    });
  }
  // the page loads silent, but the visit's FIRST click — wherever it lands — switches the sound on (it is also the
  // gesture browsers demand before audio may play, so sound works from that very click); it only happens once, so
  // switching it off with the tile afterwards sticks for the rest of the visit
  document.addEventListener('click', (e) => {
    if (e.target.closest?.('[data-sound-toggle]')) return; // the tile's own click decides for itself (below)
    if (on) return;
    on = true;
    sync(btn);
    make(); ctx?.resume?.(); tick();
  }, { once: true, capture: true });
  btn?.addEventListener('click', () => {
    on = !on;
    sync(btn);
    if (on) { make(); ctx?.resume?.(); tick(); } // the enabling click doubles as the unlock gesture; a tick confirms
  });
}
