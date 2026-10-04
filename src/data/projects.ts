// Featured projects shown in the pinned "scope" section, in order. Placeholders: swap in real work + images.
// Cards show the thumb (a flat site screenshot) on a panel in the project colours, then the title, service and year.
export interface Project {
  slug: string;        // URL of the detail page: /work/<slug>
  title: string;       // shown in the caption, e.g. "Woonpact Gent"
  label: string;       // big word on the placeholder visual
  description: string;
  service: string;     // shown next to the title on the detail page, e.g. "Development & design"
  year: number;        // shown next to the service on the detail page
  image?: string;      // detail page visual, e.g. '/projects/woonpact.jpg' (in /public). When set, replaces the placeholder
  thumb?: string;      // card visual (home + /work): a flat screenshot of the site, 16:10, shown on a panel in the project colours
  colors: { a: string; b: string; t: string }; // placeholder gradient + text colour
}

// filter categories on /work: the parts of the service ("Development & design" → Development, Design)
export const projectTags = (p: Project) => p.service.split('&').map((s) => s.trim()).filter(Boolean).map((s) => s[0].toUpperCase() + s.slice(1));

export const projects: Project[] = [
  { slug: 'woonpact-gent', title: 'Woonpact Gent', label: 'Woonpact', image: '/projects/woonpact-gent.svg', thumb: '/projects/woonpact-gent-site.svg', description: 'A unique design and a structured CMS behind the website, for the city of Ghent.', service: 'Development & design', year: 2026, colors: { a: '#3f5a2c', b: '#cfd8b4', t: '#f3efe2' } },
  { slug: 'toran', title: 'Toran', label: 'Toran', image: '/projects/toran.svg', thumb: '/projects/toran-site.svg', description: 'Planning and admin tooling in Laravel for an aviation company.', service: 'Development', year: 2026, colors: { a: '#12233d', b: '#6f93c2', t: '#e8eef7' } },
  { slug: 'portaal', title: 'Portaal', label: 'Portaal', image: '/projects/portaal.svg', thumb: '/projects/portaal-site.svg', description: 'A multi-tenant client portal with AI-assisted content.', service: 'Development & AI', year: 2026, colors: { a: '#2d2238', b: '#b69ad6', t: '#f1eaf8' } },
  { slug: 'imagoo', title: 'Imagoo', label: 'Imagoo', image: '/projects/imagoo.svg', thumb: '/projects/imagoo-site.svg', description: 'Brand and website for a videography and photography studio.', service: 'Branding & design', year: 2026, colors: { a: '#1c1a19', b: '#c9744a', t: '#f4e7dd' } },
];
