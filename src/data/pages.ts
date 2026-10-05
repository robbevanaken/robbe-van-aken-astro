// Copy for the subpages. Each page is empty for now: a label, a title and an intro.
// Project detail pages (/work/<slug>) take their copy from projects.ts.

export const workPage = {
  title: 'The project archive',
  description: 'Websites and software by Robbe Van Aken, freelance developer in Ghent: Craft CMS, Laravel and more.',
  filters: { label: 'Filter projects', toggle: 'Filter', all: 'All' }, // the other filters come from the projects' services (projectTags)
};

export const contactPage = {
  // each part in order; `muted` parts in the grey (like the footer title)
  title: [
    { text: 'Have a project in mind?', muted: true },
    { text: " Let's talk.", muted: false },
  ],
  intro: "Tell me what you're working on. I'll get back to you personally, usually within a day.", // meta description
  portrait: { image: '', alt: 'Robbe Van Aken', placeholder: 'Portrait' },
  // left column (below the form on phones); an item with href is a link
  details: [
    { label: 'Contact details', items: [
      { text: 'robbe.vanaken@gmail.com', href: 'mailto:robbe.vanaken@gmail.com' },
      { text: '+32 494 48 77 62', href: 'tel:+32494487762' },
    ] },
  ],
  socialsLabel: 'Socials',
  form: {
    // POST endpoint that accepts form data and answers JSON: public/api/contact.php mails it to you (PHP mail() on the
    // host, uploaded with the site). Empty: sending opens the visitor's email app instead.
    action: '/api/contact.php',
    questions: {
      name: 'What\'s your name?',
      email: 'What\'s your email?',
      company: 'What company are you with?',
      budget: 'What\'s your budget?',
      message: 'Tell me about your project',
    },
    placeholders: {
      firstName: 'First name *',
      lastName: 'Last name *',
      email: 'name@company.com *',
      company: 'Company (optional)',
      message: 'What are you building, and where can I help? *',
    },
    labels: { firstName: 'First name', lastName: 'Last name' }, // for screen readers (the question covers the rest)
    budgets: ['€2k – €5k', '€5k – €10k', '€10k – €15k', '€15k – €25k', '€25k +', 'Not sure yet'],
    errors: {
      firstName: 'Please fill in your first name.',
      lastName: 'Please fill in your last name.',
      email: 'Please fill in a valid email address.',
      message: 'Please tell me a little about your project.',
    },
    submit: 'Send message',
    wizard: { next: 'Next', back: 'Back', status: 'Question {n} of {total}' }, // one question at a time
    sending: 'Sending…',
    privacy: { text: 'I only use your details to reply to you.', link: { label: 'Privacy notice', href: '/privacy' } },
    sent: { title: 'Thanks, your message is on its way.', text: "I'll read it properly and get back to you within a day or so." },
    mailto: { title: 'Your email app should open now.', text: 'The message is filled in, you only need to press send. Nothing opened? Email me at' },
    failed: 'Something went wrong while sending. Please try again, or email me directly at',
    subject: 'New project enquiry', // email subject (mailto) and form subject (endpoint)
  },
};

// Privacy notice (/privacy, sections/Legal.astro). `company`: fill in `address` and `number` (the registered address and
// the company number of the BV): they only show once they're filled in. Every section: a title and blocks: `p` (a
// paragraph; may hold links), `list` (short points), `rows` (a small table: name, what it's for, how long it's kept).
// Keep it in step with what the site really does (cookie consent, the contact form, analytics once there are any).
export const privacyPage = {
  title: 'Privacy notice',
  intro: 'What this site knows about you, why, and for how long. The short version: very little.',
  description: 'How robbevanaken.be handles your data: the contact form, cookies and your rights.',
  updated: { label: 'Last updated', date: '5 October 2026' },
  company: { name: 'Robbe Van Aken BV', address: '', number: '', place: 'Ghent, Belgium', email: 'robbe.vanaken@gmail.com' },
  sections: [
    { title: 'Who is responsible',
      blocks: [
        { p: 'This site is run by Robbe Van Aken BV, a company based in Ghent, Belgium. It decides what happens with the personal data described here, and it is who you contact with any question about it.' },
        { company: true },
      ] },
    { title: 'What I collect, and why',
      blocks: [
        { p: 'Only what you send me yourself, and what a website technically needs to be shown.' },
        { rows: [
          { name: 'Contact form', text: 'Your name, email address, message, and your company and budget range if you fill them in. I use them to answer you and, if it comes to that, to prepare a proposal.', kept: 'See "How long I keep it"' },
          { name: 'Email', text: 'If you email me directly, I keep your message and address for the same purpose.', kept: 'Same as the contact form' },
          { name: 'Server logs', text: 'Like every website, the server notes your IP address, the page you asked for, the time and your browser. These logs are only used to keep the site safe and working.', kept: 'A limited time, set by the hosting provider' },
        ] },
        { p: 'I do not build profiles, I do not sell or rent out data, and nothing here is decided about you automatically.' },
      ] },
    { title: 'Why I am allowed to',
      blocks: [
        { list: [
          'Answering your message and preparing a proposal: steps taken at your request before a possible contract.',
          'Keeping the site safe and working: my legitimate interest in a secure, reliable website.',
          'Analytics (Google Analytics, through Google Tag Manager): only with your consent, which you can withdraw at any time.',
          'Keeping business records of projects: a legal obligation.',
        ] },
      ] },
    { title: 'Cookies and storage',
      blocks: [
        { p: 'This site stores as little as it can in your browser. There are no advertising cookies.' },
        { rows: [
          { name: 'cc_cookie', text: 'Remembers your cookie choice, so the banner does not come back on every page.', kept: '6 months' },
          { name: 'mode', text: 'Remembers whether you chose the light or the dark theme (local storage, never sent to the server).', kept: 'Until you clear it' },
          { name: '_ga, _ga_*', text: 'Google Analytics: tells visits apart, so I can see how the site is used. Only set when you allow analytics.', kept: '2 years' },
          { name: 'loaded', text: 'Notes that the opening animation has played, so it only plays once per visit (session storage).', kept: 'Until you close the tab' },
        ] },
        { p: 'With your permission, this site uses Google Tag Manager to load Google Analytics, which tells me how the site is used (pages visited, rough location, device), never who you are. It only runs after you allow analytics. You can change your choice at any time in the <button type="button" data-cookie-settings>cookie settings</button>.' },
        { p: 'The fonts are served from this site itself, so no request goes to Google Fonts or any other font service. Links to Instagram and LinkedIn are plain links: those sites only see you once you click through.' },
      ] },
    { title: 'Who else sees it',
      blocks: [
        { p: 'A small number of service providers, only as far as they need to for their part:' },
        { list: [
          'The hosting provider that serves this site and delivers the contact form to my mailbox.',
          'Google (Analytics and Tag Manager, only with your consent; Gmail, where my mailbox lives). Google may process data outside the European Economic Area; it does so under the EU–US Data Privacy Framework and standard contractual clauses.',
          'People I bring into a project, when your enquiry concerns them, and only what they need.',
        ] },
        { p: 'Beyond that I only share data when the law requires it.' },
      ] },
    { title: 'How long I keep it',
      blocks: [
        { list: [
          'An enquiry that does not become a project: deleted within 12 months after our last contact.',
          'An enquiry that becomes a project: kept with the project file for as long as Belgian law requires business records to be kept.',
          'Your cookie choice: 6 months, after which the banner asks again.',
        ] },
      ] },
    { title: 'Your rights',
      blocks: [
        { p: 'You can ask me to show you the data I hold about you, to correct it, to delete it, to limit what I do with it, or to hand it over in a common format. You can also object to its use, and withdraw a consent you gave. Email me and I will answer within a month. It costs nothing.' },
        { p: 'Not happy with how I handled it? I would rather hear it first, but you can always complain to the Belgian Data Protection Authority (Gegevensbeschermingsautoriteit), Drukpersstraat 35, 1000 Brussels, <a href="mailto:contact@apd-gba.be">contact@apd-gba.be</a>, <a href="https://www.dataprotectionauthority.be" rel="noopener">dataprotectionauthority.be</a>.' },
      ] },
    { title: 'Changes',
      blocks: [
        { p: 'When the site changes, this notice changes with it. The date at the top tells you which version you are reading.' },
      ] },
  ],
};

// 404: the code in big type with the R as its 0 (it turns with the mouse and its pixels move away from the cursor, like
// the footer's), then the title, the intro and the way home
export const notFoundPage = {
  label: 'Error 404', // for screen readers (the big 404 is decorative)
  title: "This page doesn't exist.",
  intro: 'It may have moved, or the link is off. The home page is a good place to start again.',
  cta: { label: 'Back to home', href: '/' },
};

export const projectPage = {
  label: 'Project',
  service: 'Service',    // label above the service next to the title
  year: 'Year',          // label above the year next to the service
  placeholder: 'Case study coming soon',
  next: 'Next project',  // label above the title in the scroll-to-next section
  back: 'All projects',
};
