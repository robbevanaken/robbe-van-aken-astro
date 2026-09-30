// robots.txt: everything may be crawled; points to the sitemap on the live domain (astro.config `site`).
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site)}\n`);
