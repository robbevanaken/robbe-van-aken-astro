// Copy for the subpages. Each page is empty for now: a label, a title and an intro.
// Project detail pages (/work/<slug>) take their copy from projects.ts.

export const workPage = {
  title: 'The project archive',
  filters: { label: 'Filter projects', toggle: 'Filter', all: 'All' }, // the other filters come from the projects' services (projectTags)
};

export const aboutPage = {
  title: 'About', // page <title>
  intro: 'Freelance developer in Ghent, with an eye for design.', // meta description
  // one statement: a big title in two parts (the first muted), the lead below it, then three columns
  heading: [
    { text: 'Freelance developer,', muted: true },
    { text: 'with an eye for design.', muted: false },
  ],
  lead: "I build websites, platforms and apps from Ghent, in whatever stack the project asks for. Development is what I do every day; a good eye for design is what makes the difference in the details. For bigger projects I bring in people I trust, so the right skills are always at the table.",
  // the three columns: a small title (label), then titled entries (items) or lists (groups)
  sections: [
    { label: 'How I build',
      items: [
        { title: 'Built the way it was designed', text: "I read a design the way it was meant and build it that way. The details that matter survive the build, and technical limits are on the table early, not late." },
        { title: 'Built to be handed over', text: "A site is only finished when your team can run it without me. Clear content structures, a CMS that's pleasant to use, and code someone else can pick up." },
        { title: 'AI where it actually helps', text: "I use AI where it saves real time, for you or for me, and leave it out where it doesn't. No gimmicks, just less tedious work." },
        { title: 'The right people at the table', text: "For bigger projects I bring in specialists I trust, from copywriting to illustration, so you get the right skills without managing a crowd." },
      ] },
    // no favourites: what I can work with, the project decides
    { label: 'Stack',
      groups: [
        { label: 'Web', items: ['Craft CMS', 'Laravel', 'PHP', 'Next.js', 'Astro', 'JavaScript', 'TypeScript'] },
        { label: 'Apps & motion', items: ['Flutter', 'GSAP', 'WebGL'] },
        { label: 'Design', items: ['Figma', 'Typography', 'Brand identity', 'Motion'] },
      ] },
    { label: 'Ship',
      items: [
        { title: 'Hosting & deploys', text: 'A reliable setup, automated deploys, and backups you never have to think about.' },
        { title: 'Performance', text: 'Fast on a slow connection, light on the device in your pocket.' },
        { title: 'Accessibility', text: 'Usable with a keyboard and a screen reader, readable for everyone.' },
        { title: 'Maintenance', text: 'Updates, small changes and a hand when you need one, long after launch.' },
      ] },
  ],
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
