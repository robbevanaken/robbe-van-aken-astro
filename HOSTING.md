# Hosting briefing: robbevanaken.be

Briefing for putting the site live and keeping it fast. Read alongside `CLAUDE.md` (how the site is built). Written for
whoever does the deploy, a person or Claude.

## Decision

- **Host: Combell** (Belgian shared hosting, Apache + PHP). Chosen because the site runs on it as is:
  - the contact form is a PHP endpoint (`public/api/contact.php`, PHP `mail()`);
  - the clean URLs and the 404 page come from `public/.htaccess` (Apache);
  - servers and data in the EU (matches the privacy notice).
- **Optional, recommended later: Cloudflare (free plan) in front of Combell**, DNS only moved to Cloudflare. Adds a global
  CDN, HTTP/3, Brotli and DDoS protection; the site itself stays on Combell.
- Considered and not chosen: Cloudflare Pages / Netlify / Vercel. Slightly faster worldwide, but no PHP (the contact
  form would need a serverless function + a mail API such as Resend) and no `.htaccess` (rewrites move to their own config).

## What gets deployed

- `npm run build` → upload **the contents of `dist/`** to the web root (`www/` / `public_html/` on Combell). Upload
  `.htaccess` too: it's a dotfile, some FTP clients hide it.
- Static pages, built as files (`astro.config.mjs`: `build.format: 'file'`): `index.html`, `work.html`,
  `work/<slug>.html`, `contact.html`, `privacy.html`, `404.html`, plus `sitemap.xml`, `robots.txt`.
- `api/contact.php`: the only server-side code.
- Canonical domain in `astro.config.mjs`: `site: 'https://robbevanaken.be'` (no `www`). Every canonical URL, the
  sitemap and the social previews use it: rebuild if it changes.

## Combell setup checklist

1. **PHP 8.1+** in the control panel (`contact.php` uses `never` and `mb_*`).
2. **HTTPS**: free Let's Encrypt certificate on `robbevanaken.be` and `www.robbevanaken.be`.
3. **Redirects** (add at the top of `public/.htaccess`, then rebuild): http → https and www → bare domain, one 301 hop:
   ```apache
   RewriteEngine On
   RewriteCond %{HTTPS} off [OR]
   RewriteCond %{HTTP_HOST} ^www\. [NC]
   RewriteRule ^ https://robbevanaken.be%{REQUEST_URI} [L,R=301]
   ```
   (Behind Cloudflare use `%{HTTP:X-Forwarded-Proto} !https` instead of `%{HTTPS} off`, or let Cloudflare do the redirects.)
4. **Mail for the contact form**:
   - Create the mailbox / alias `website@robbevanaken.be` (the `From` address in `contact.php`), or change `FROM` to one
     that exists on the domain.
   - DNS: **SPF** including Combell's mail servers, **DKIM** on, a **DMARC** record (`p=none` to start). Without these
     the form's mails land in Gmail's spam.
   - Test: send the form on the live site, check the mail arrives, Reply-To is the visitor.
   - If `mail()` is blocked or unreliable: switch `contact.php` to Combell's SMTP (PHPMailer + SMTP credentials), keep the
     JSON answers the page expects (`{"ok":true}` / `{"ok":false,...}`).
5. **Clean URLs**: `/work`, `/work/toran`, `/contact` must answer **200 without a redirect** and without a trailing
   slash (`.htaccess`: `DirectorySlash Off` + the `.html` rewrite). `/nope` must answer **404** with the 404 page.

## Performance: in `public/.htaccess`

Already in the repo (compression, caching, security headers). For reference:

```apache
# Compression
<IfModule mod_brotli.c>
  AddOutputFilterByType BROTLI_COMPRESS text/html text/css application/javascript application/json image/svg+xml text/plain application/xml
</IfModule>
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml text/plain application/xml
</IfModule>

# Caching: Astro's built files have a hash in their name (/_astro/*): cache them for a year.
# Fonts and images: a month. HTML: always revalidate (so a new deploy shows at once).
<IfModule mod_headers.c>
  <If "%{REQUEST_URI} =~ m#^/_astro/#">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </If>
  <FilesMatch "\.(woff2|jpg|jpeg|png|webp|avif|svg|ico)$">
    Header set Cache-Control "public, max-age=2592000"
  </FilesMatch>
  <FilesMatch "\.(html|xml|txt)$">
    Header set Cache-Control "public, max-age=0, must-revalidate"
  </FilesMatch>
  <FilesMatch "\.php$">
    Header set Cache-Control "no-store"
  </FilesMatch>
  # security basics
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Strict-Transport-Security "max-age=31536000"
</IfModule>
```

Other performance notes (done):
- **Images**: project visuals go through `ui/ProjectImage.astro` (AVIF + WebP, `srcset`), sources in `src/assets/projects/`.
- **JS**: page-specific scripts (contact form, work filter) are lazy chunks; the cookie banner loads when the browser is idle.
- **CSS** is inlined in every page (no render-blocking stylesheet).
- The fonts are self-hosted and the two that every page needs are preloaded.
- Lighthouse locally (mobile): 97–100 on every category, every page.
- The repo's `.htaccess` leaves `Strict-Transport-Security` out on purpose: add it (as above) once HTTPS works on the domain.

## Analytics (Google Tag Manager)

- Container `GTM-PHRBR9CS`, only in production builds (`layouts/Base.astro`, `process.env.NODE_ENV`), and it only runs
  once a visitor accepts analytics in the cookie banner (consent mode v2: denied by default).
- **To set up in GTM**: the site changes pages without reloading. Add a trigger on the custom event `page_view_swap`
  (pushed with `page_path` and `page_title`) and fire the GA4 page view on it, next to the normal first page view.
- Keep the privacy notice (`privacyPage` in `src/data/pages.ts`) in step with what GTM loads (GA4 now; anything else
  added later must be named there too).

## Before going live

- [ ] Privacy notice: fill in the company's registered address and number (`privacyPage.company` in `src/data/pages.ts`),
      name the host (Combell) under "Who else sees it", have it read by someone legal.
- [ ] Portraits (`contactPage.portrait.image`, `pitch.portrait.image`) and real project visuals.
- [ ] `public/og.png` is the social preview (1200×630): check it.
- [ ] Contact form tested live (see Mail above).
- [ ] Search Console: add the domain, submit `https://robbevanaken.be/sitemap.xml`.
- [ ] Spot checks after the deploy: `/`, `/work`, a project, `/contact`, `/privacy`, `/nope` (404), the cookie banner, the
      theme toggle, and a page transition; PageSpeed Insights on `/` and a project page (mobile).

## Deploy routine

1. `npm run build` (must end with "Complete!").
2. Upload `dist/` (including `.htaccess` and `api/`) over the old files; remove files that no longer exist (old
   `/_astro/*` bundles can stay a while for visitors with an old page open, they're harmless).
3. Spot checks (above). HTML is never cached long (see Caching), so the new version is live at once; behind Cloudflare,
   purge its cache after a deploy.
