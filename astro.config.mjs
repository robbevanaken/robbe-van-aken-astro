import { defineConfig } from 'astro/config';

export default defineConfig({
  // the live domain: used for canonical URLs, social previews (og:url, og:image) and the sitemap
  site: 'https://robbevanaken.be',
  // pages as files (/work.html, /work/<slug>.html), served without .html and without a trailing slash by
  // public/.htaccess, so /work (as in every link, canonical and the sitemap) answers directly, no redirect to /work/
  build: { format: 'file', inlineStylesheets: 'always' }, // CSS inlined in each page: no render-blocking stylesheet request
});
