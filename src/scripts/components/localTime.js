// A live clock (`<time data-local-time="Europe/Brussels">`, contact's title frame): the time where he is, hh:mm,
// updated on the minute. Empty (and hidden) until the script fills it. A minute tick swaps the digits in place; only
// the arrival rolls them in (the frame's .is-in lands after the first tick).
export function initLocalTime(root = document) {
  const els = [...root.querySelectorAll('[data-local-time]')];
  if (!els.length) return;
  let timer = 0;
  const tick = () => {
    const now = new Date();
    for (const el of els) {
      const f = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: el.dataset.localTime });
      const t = f.format(now);
      // inside the title frame's note the characters come in one by one (data-ch-offset: where the time joins the
      // sequence, _title-frame.css); elsewhere plain text
      const off = +el.dataset.chOffset;
      if (Number.isNaN(off)) el.textContent = t;
      else el.innerHTML = [...t].map((c, k) => `<span class="c-title-frame__ch" style="--i:${off + k}"><span>${c}</span></span>`).join('');
    }
    timer = setTimeout(tick, 60000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 50);
  };
  tick();
  return () => clearTimeout(timer);
}
