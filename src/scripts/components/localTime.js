// A live clock (`<time data-local-time="Europe/Brussels">`, contact's title frame): the time where he is, hh:mm,
// updated on the minute. Empty (and hidden) until the script fills it.
export function initLocalTime(root = document) {
  const els = [...root.querySelectorAll('[data-local-time]')];
  if (!els.length) return;
  let timer = 0;
  const tick = () => {
    const now = new Date();
    for (const el of els) {
      const f = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: el.dataset.localTime });
      el.textContent = f.format(now);
    }
    timer = setTimeout(tick, 60000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 50);
  };
  tick();
  return () => clearTimeout(timer);
}
