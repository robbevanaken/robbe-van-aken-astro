// Contact form (sections/ContactForm.astro). Hooks: [data-contact] (wrapper), [data-contact-form] (the form; data-email,
// data-subject, data-sending), [data-contact-field] (a required field's wrapper; the input carries data-error),
// [data-contact-grow] (textarea that grows with its text), [data-contact-submit], [data-contact-failed],
// [data-contact-done="sent" | "mailto"] (shown instead of the form).
// Validation: on submit (the form has novalidate), then live per field once it has been flagged; the first invalid
// field gets focus, errors are tied to their input (aria-invalid + aria-describedby).
// Sending: with an action (contactPage.form.action) the form data is POSTed (JSON answer expected, e.g. Formspree);
// without one the visitor's email app opens with the message filled in. A filled-in spam trap ("website") fakes success.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function initContactForm(root = document) {
  const wrap = root.querySelector('[data-contact]');
  const form = wrap?.querySelector('[data-contact-form]');
  if (!form) return null;
  const ac = new AbortController(), on = { signal: ac.signal };
  // by: the input's own aria-describedby (e.g. the question), the error id is added after it
  const fields = [...form.querySelectorAll('[data-contact-field]')].map((el) => {
    const input = el.querySelector('input, textarea');
    return { el, input, by: input.getAttribute('aria-describedby') || '' };
  });
  const submit = form.querySelector('[data-contact-submit]'), submitText = submit?.querySelector('.c-button__text');
  const failed = form.querySelector('[data-contact-failed]');
  let tried = false;

  const valid = ({ input }) => {
    const v = input.value.trim();
    return input.type === 'email' ? EMAIL.test(v) : v.length > 0;
  };
  const mark = (f, ok) => {
    f.el.classList.toggle('is-invalid', !ok);
    let msg = f.el.querySelector('.c-contact-form__error');
    if (ok) msg?.remove();
    else if (!msg) {
      msg = document.createElement('span');
      msg.className = 'c-contact-form__error u-text-ui';
      msg.id = `cf-err-${f.input.id}`;
      msg.textContent = f.input.dataset.error || '';
      f.el.append(msg);
    }
    const by = ok ? f.by : `${f.by} ${msg.id}`.trim();
    if (by) f.input.setAttribute('aria-describedby', by); else f.input.removeAttribute('aria-describedby');
    if (ok) f.input.removeAttribute('aria-invalid'); else f.input.setAttribute('aria-invalid', 'true');
  };
  // once a submit has been tried, fields re-check as you type (and clear their error as soon as they're right)
  fields.forEach((f) => {
    f.input.addEventListener('input', () => { if (tried || f.el.classList.contains('is-invalid')) mark(f, valid(f)); }, on);
    f.input.addEventListener('blur', () => { if (tried) mark(f, valid(f)); }, on);
  });

  // the message box grows with its text
  const area = form.querySelector('[data-contact-grow]');
  const grow = () => { if (!area) return; area.style.height = 'auto'; area.style.height = `${area.scrollHeight}px`; };
  area?.addEventListener('input', grow, on);
  addEventListener('resize', grow, on);

  const show = (kind) => {
    const done = wrap.querySelector(`[data-contact-done="${kind}"]`);
    form.hidden = true;
    done.hidden = false;
    done.focus({ preventScroll: true });
    const top = wrap.getBoundingClientRect().top;
    if (top < 0) wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const sending = (v) => {
    form.classList.toggle('is-sending', v);
    if (submit) submit.disabled = v;
    if (submitText) {
      if (!submitText.dataset.label) submitText.dataset.label = submitText.textContent;
      submitText.textContent = v ? form.dataset.sending : submitText.dataset.label;
    }
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    tried = true;
    failed.hidden = true;
    const bad = fields.filter((f) => { const ok = valid(f); mark(f, ok); return !ok; });
    if (bad.length) { bad[0].input.focus(); return; }
    const data = new FormData(form);
    if (data.get('website')) { show('sent'); return; } // spam trap

    const action = form.getAttribute('action');
    if (!action) {
      // no endpoint: hand the message to the email app
      const name = `${data.get('first_name')} ${data.get('last_name')}`.trim();
      const lines = [
        data.get('message'),
        '',
        `${name}`,
        data.get('email'),
        data.get('company') && `Company: ${data.get('company')}`,
        data.get('budget') && `Budget: ${data.get('budget')}`,
      ].filter((l) => l !== null && l !== false && l !== undefined);
      const subject = `${form.dataset.subject}: ${name}`;
      location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
      show('mailto');
      return;
    }
    sending(true);
    try {
      const res = await fetch(action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      show('sent');
    } catch {
      failed.hidden = false;
    } finally {
      sending(false);
    }
  }, on);

  return () => ac.abort();
}
