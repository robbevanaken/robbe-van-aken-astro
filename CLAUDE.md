# Robbe Van Aken, portfolio site

Personal site for Robbe Van Aken, a freelance developer (Craft CMS, Laravel) with a background in design, based in Ghent. It replaces the old Booold brand. Goal: an Awwwards Site of the Day. Development leads the positioning, branding is offered more quietly, and copy should never suggest he works strictly alone (he brings in people on bigger projects).

## Stack
Astro (static), plain JS modules, GSAP (ScrollTrigger, ScrambleText, SplitText) + Lenis, swup (page transitions, + head and preload plugins). No framework components. `npm run dev` / `npm run build`.

## File structure (same conventions as the woonpact project, without Tailwind)
- `src/data/` all copy. `site.ts` (per section, in page order, plus `socials` for footer + mobile menu), `pages.ts` (subpages), `clients.ts`, `projects.ts`, `services.ts`. Change text here, not in components.
- `src/components/sections/` one file per page section, `ui/` small reusable pieces (Button, Icon, Corners, Marquee, Placeholder), `layout/` Nav, PageTransition (loader/transition veil, in `Base.astro`) + dev-only DevHud and GridOverlay. Components contain markup only: no `<style>` or `<script>`.
- `src/styles/main.css` imports, in order: `base/` (`_fonts.css`: self-hosted Inter Tight @font-face (files in `public/fonts`, OFL license alongside, latin 400/500 preloaded in `Base.astro`); `_tokens.css`: colours, grid, type scale, spacing, eases; `_document.css`: reset, selection, R canvas) → `objects/` (`_container.css`, `_grid.css`) → `components/` (one `_name.css` per component, imported alphabetically in `index.css`) → `utilities/` (`_text.css`, `_screen-reader.css`) → `vendor/` (`_cookieconsent.css`).
- `src/scripts/main.js` is the only script entry (loaded from `layouts/Base.astro`). Once: eases, Lenis, cookie consent, page transitions. Per page: `mount()` runs every page init again after each swup swap; each init does nothing when its element is missing and returns a cleanup (window listeners via an AbortController, ticker callbacks removed, ScrollTriggers killed), which `unmount()` calls before the content is replaced. New page scripts must follow this. `global/` (eases, lenis, siteHeader, reveal, cookieConsent, debugGrid, pageTransitions), `components/` (featuredProjects, scrollNext, marquee, highlightText, textHover), `r-journey/` (the R engine, veil).
- `public/clients/` client logos (white SVG, one file per logo).

## Class and hook conventions
- Namespaced BEM: `o-` objects (`o-container` = page margins, `o-grid` = the column grid, used together), `c-` components (`c-site-header__nav-link`, modifiers `--name`), `u-` utilities (`u-text-display/h2/lead/body-l/ui/label/muted`, `u-sr-only`). State classes: `is-*` (`is-hidden`, `is-open`, `is-in`, `is-on`, `is-off`).
- JS never selects on styling classes: it uses `data-` attributes (`data-site-header`, `data-menu-toggle`, `data-featured-projects` + `data-fp-*`, `data-service` / `data-service-slot`, `data-marquee`, `data-reveal`, `data-highlight-text`, `data-scroll-next-*`, `data-debug-grid`). Exceptions: the R anchor ids (`#a-hero`, `#a-pitch`, `#a-craft`, `#a-foot`), `#r-canvas`, and the dev HUD ids.
- The dev HUD (Glyph/Grid, bottom right) and the grid overlay only render in `npm run dev`, never in the build.

## Pages
- `/` home (`src/pages/index.astro`, the only page with the R canvas).
- Each R is its own engine instance: one per `<canvas data-r-canvas>`, limited to `data-r-scope` (home: whole page; subpages: `[data-site-header]` for the small header R and `[data-site-footer]` for the big footer R). Instances whose scope is off screen skip their work. The small R (stage 2: projects on home, header on subpages) turns with the mouse like the hero R, at 45% strength (`follow`, `FS` in the engine). Small R's (<~140px) are boosted to mostly bright crosses so they read white.
- `/work`, `/work/<slug>` (one per project, slug in `projects.ts`), `/about`, `/contact`, `/privacy`: empty templates on `src/layouts/Page.astro` (Nav + content + Footer). On subpages the R has one stage: small and calm, centred in the header (`<Nav withR>` renders `#a-craft` there; the engine falls back to `#a-craft` for every anchor a page doesn't have). The footer there has its own separate R.
- Project detail pages end in "scroll to next project" (`sections/ScrollNext.astro` + `scripts/components/scrollNext.js`, Osmo resource in our style: next project's visual full-screen, corners closing in, a 6-column progress line; at 100% it opens the next project). These pages have no footer (`<Page footer={false}>`). Copy in `src/data/pages.ts`; `PageIntro.astro` renders label/title/intro, `ui/Placeholder.astro` marks unwritten content.
- In the featured projects, clicking the active project (or the caption label) opens its detail page; clicking a side project scrolls it in.

## Cookie consent
`vanilla-cookieconsent` v3, started from `scripts/main.js` (all pages) via `scripts/global/cookieConsent.js`; theme in `styles/vendor/_cookieconsent.css`. Categories: necessary + analytics (no analytics script exists yet; load one with `type="text/plain" data-category="analytics"`). Footer "Cookie settings" reopens the preferences (`data-cookie-settings`, a delegated click so it survives page swaps). The banner is hidden from bots (`hideFromBots`, default), so headless test browsers won't show it unless `navigator.webdriver` is spoofed.

## Page transitions (swup, `scripts/global/pageTransitions.js`)
- Everything in `<body>` except the veil lives in `#swup` and is swapped. Use `navigate(url)` from `pageTransitions.js` for programmatic navigation. Scroll restoration is manual (set through `ScrollTrigger.clearScrollMemory('manual')`, ScrollTrigger overrides it otherwise); every swap lands at the top; Lenis is stopped during a transition.
- Veil (`r-journey/veil.js`, canvas in `layout/PageTransition.astro`, z 100): a grid of glyph cells; a dithered wave (crosses at the front, a few orange, solid background behind) closes from the click point, the R dithers in and shimmers in the middle, then the R dithers out while the wave bursts open from the centre.
- Loader (first load): `html.is-loading` (set inline in `Base.astro`, safety timeout 9s) covers the page; the R builds up while "Loading 000–100" follows fonts + images (min 1.3s, max 6s), then the veil opens.
- Next project (project detail): no veil. In the second half of the scroll-next section the full-screen visual shrinks to exactly its box on the next page (measured by cloning this page's intro + visual with the next project's texts, `data-next-*` on the section, hooks `data-page-intro*`, `data-project-visual`, `data-project-media`). On the swap the visual is lifted into a fixed copy (`handOff`), the new page's header, R, intro and the rest fade in around it (`arrive`). The link only fires after real input (wheel/touch/keys), so back/forward never re-triggers it.
- `prefers-reduced-motion`: no loader, instant swaps.

## Motion
- Text scramble: only on the project caption label (`01 — TITLE`), when the active project changes (GSAP ScrambleText in `components/featuredProjects.js`). Removed everywhere else on purpose.
- Highlight text on scroll (Osmo Supply resource, kept as delivered, `scripts/components/highlightText.js`): `data-highlight-text` on longer texts (pitch quote, projects title, services intro + descriptions, footer title); letters go from 0.2 to full opacity, scrubbed with scroll.
- Hovers use the "punch" ease (`--ease-punch` in CSS, `CustomEase 'punch'` in GSAP via `scripts/global/eases.js`, same curve).
- Button hover: scales down slightly, brand arrow turns from 45° to 0°, four corner brackets slide out of the button's corners.
- Footer: title spans 5 columns, "Let's build" in the muted grey (title parts in `site.ts`); the footer is one screen + the marquee tall, so at the very bottom the marquee sits just above the fold.
- Name/title top left (`data-text-hover`, `components/textHover.js`): on hover the text reveal plays in reverse as a wave (letters dim right to left and come straight back).
- Mobile: the menu toggle's lines spread (bottom one shortens) on hover, the open cross spins a quarter turn; slide-out items start at the top, and on hover/tap the others dim while the active one shifts right.
- Nav links: underline that wipes in from the left. Footer email: light underline, orange one wipes in on hover.
- Marquee (`components/marquee.js`): constant loop that speeds up with scroll velocity (both directions) and eases back.
- Glyph cells scale with the shape's size below 140px (service icons and the small header/projects R, ~36 glyphs tall, min 3 device px per glyph); big R's use the density-based size. Service icons are rasterised at 60×60 (`IG`) for detail. Glyphs are the intended look; pixel mode is only a dev fallback.
- The R canvas (`#r-canvas`, z 35) always renders above the fixed header (z 30).
- Hero: the hero is `100svh - --marquee-h`, so the orange banner sits just above the fold; the scroll hint has a looping scrollbar thumb.
- Trusted by: corners start around the logo and move apart to the cell edges, then the logo fades in (staggered).
- Everything is off or instant with `prefers-reduced-motion`.

## Layout grid (Figma frame 1440 wide)
12 columns, 60px margin, 20px gutter at 1440, fluid in vw (tokens `--cols`, `--margin`, `--gutter`). 6 columns below 1024px, 4 below 640px. Every section is `.o-container.o-grid` and places children with `grid-column`; nested rows use `subgrid`. Press `L` in dev (or the HUD "Grid" button) for the column overlay.
Placement @1440: hero title cols 1–4, R 5–8, intro 10–12 · trusted-by logos 4 × 3 cols · pitch R 1–6, quote 7–12, portrait 7–9 · projects title 1–5 (lead size), image always exactly 6 columns (cols 4–9; all 4 on phones), corner brackets one gutter outside; on short screens only the height shrinks (cover crop); caption on the same span, next project parked on col 12.

## Type scale (`styles/base/_tokens.css`, sizes @1440, measured from Figma)
display 58 · h2 48 · lead 32 · body-l 20 · body 16 · ui 15 · label 12 (uppercase, medium, tracked). Use the `.u-text-display/-h2/-lead/-body-l/-ui/-label` classes instead of one-off sizes.

## The core idea: one R that travels
A blackletter R (source: `public/R.svg`, path in `src/scripts/r-journey/r-shape.js`) is sampled into particles once and then moves through the whole page on a fixed full-screen canvas (`#r-canvas`). It is one object throughout; nothing is swapped.

States are defined by elements with `data-stage` (the engine blends between them based on scroll):

| stage | section | what the R does | anchor element |
|---|---|---|---|
| 0 | Hero | big, extruded 3D, tumbles with the mouse | `#a-hero` |
| 1 | Pitch (`#about`) | "exploded view": fragments slightly apart, still readable | `#a-pitch` |
| 2 | Projects (pinned) | small at the top center, turns with the mouse | `#a-craft` |
| 3 | Services | splits in 4 quarters that rebuild into 3D icons | `[data-service-slot]` (4x) |
| 4 | Footer | big again, pixels get pushed away by the cursor | `#a-foot` |

Between stages the R does a full turn around its Y axis. The pinned projects section uses stage 2 twice (`.c-featured-projects` is also `data-stage="2"`), so the R holds still during the pin. Anchors are plain empty elements in the layout, so positions come from CSS and stay responsive.

## Engine (`src/scripts/r-journey/engine.js`)
- `build()`: rasterize the R, create cap particles (front/back face) + side-wall particles (extrusion layers), Voronoi fragments for stage 1, quadrant split + icon assignment for stage 3. Icons are drawn in `drawIcon` (gothic window, split lozenge, star, shield).
- `frame()`: compute scroll state `s`, per-stage rotation matrices, per-particle 3D targets with springs, lighting (light dir `LX/LY/LZ`), then draw.
- Rendering: **glyph dither** by default (Unicorn Studio "Glyph Dither" look: screen grid, each cell empty / dim cross / bright cross). Fallback raw pixel mode exists; toggle with the dev HUD or `G`.

Tunables worth knowing:
- `DEPTH` extrusion thickness; `RY/RX/RZ[...]` rotation amounts per stage (in `frame`).
- `DENS[]` particle size per stage (lower = looser, e.g. icons at .48).
- Glyph look: `G_GAMMA`, `G_COLORS`, sprite `pad` / `lineWidth` in `sprites()`, grid size `CELL` in the glyph draw block.
- `PAL` colour ramp for pixel mode.

## Featured projects (`src/scripts/components/featuredProjects.js`)
Pinned section, continuous (no stepped timeline): one smoothed value `cur` (project index, fractional in between) drives card position/scale/opacity, a small image parallax, the frame "breathing" in between projects, and the caption (label scrambles, description cross-fades). When scrolling stops in between it glides to the nearest project in the scroll direction; clicking a side project brings it in. Sizes come from the grid: hidden rulers `[data-fp-ruler="col1|col2|next"]` (column + gutter width, resting column of the next project) in the intro section of `Projects.astro`, outside the pinned part; the image always fills the 6-column span; `RATIO` is its aspect, and on short screens only its height gives (min 160px). Data lives in `src/data/projects.ts`; set `image` to use a real visual.

## Design rules
- `::selection` is orange with dark text.
- Palette tokens in `src/styles/base/_tokens.css` `:root` (dark warm brown `#170e0b`, orange `#ff4a00` accent used sparingly). Text is only ever white `#FFFFFF` (`--fg`) or grey `#B2B2B2` (`--muted`, `.t-muted`), as in Figma.
- Inter Tight for all type, self-hosted (no Google Fonts requests). The R is the one bold element; keep everything around it quiet.
- Copy: English, sentence case, plain and honest, "not salesy, not slimy". Key line: "Solid code, thoughtful design, genuine care for the craft, and AI where it actually helps. I want to build something we're both proud of. That's the whole pitch."
- Respect `prefers-reduced-motion` (engine and GSAP already do).
- Extreme heights: R anchors use `clamp(min, Nvh, max)` heights, the pitch R is also capped by its box width, the projects section tightens its spacing below 700px height.

## Open work / ideas
- Replace placeholder projects with real work and imagery; project detail pages + page transitions.
- Port the engine to WebGL (instanced quads or a point shader + dither pass) for performance on low-end devices; Canvas 2D is near its limit.
- Mobile pass: particle counts, pin behaviour, touch interaction for the footer.
- Portrait/video in the pitch section (currently a placeholder box).
- Possibly source content from Craft CMS later (headless) if the site grows.
