// Copy for the subpages. Each page is empty for now: a label, a title and an intro.
// Project detail pages (/work/<slug>) take their copy from projects.ts.

export const workPage = {
  title: 'The project archive',
  filters: { label: 'Filter projects', toggle: 'Filter', all: 'All' }, // the other filters come from the projects' services (projectTags)
};

export const aboutPage = {
  label: 'About',
  title: 'The person behind the code',
  intro: 'A designer who learned to code, and never stopped caring about both. The full story is on its way.',
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

export const privacyPage = {
  label: 'Legal',
  title: 'Privacy notice',
  intro: 'How this site handles your data. The full notice is coming soon.',
};

export const notFoundPage = {
  label: '404',
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
