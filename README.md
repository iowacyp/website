# IowaCYP.com - Static Site (Eleventy + Tailwind)

Fast, secure, low-cost replacement for the WordPress build. Uses Eleventy (11ty), TailwindCSS, and a small amount of vanilla JS so the site can live on Netlify (or any static host) with no CMS.

## Commands
```bash
npm install        # install dependencies
npm run dev        # local dev server on http://localhost:8080
npm run build      # production build -> dist/
npx serve dist     # optional static preview after build
```

## Content and Data
- Page templates: `src/pages/*.njk` (Home, About, Stories, Events, Support, Resources, Contact). Each file sets `title`, `description`, and its permalink.
- Shared layout and chrome: `src/_includes/layouts/base.njk` and `src/_includes/partials/`.
- Global configuration (contact email, social handles, mailto/form links, app store URLs) lives in `src/data/site.json`. Update this file when outreach links change.
- Upcoming events: edit `src/data/events.json`. Eleventy copies it to `/events.json` so `main.js` can render it on `/events`.
- Full events: in `src/data/events.json`, set `"full": true` on any event that has hit capacity. This adds a black transparent overlay with red `Full` lettering and replaces the registration button with `Event full`. Set it back to `"full": false` or remove the field to reopen registration.
- Tailwind source: `src/assets/css/tailwind.css`. PostCSS compiles to `dist/assets/css/site.css`.
- JavaScript: `src/assets/js/main.js` handles the mobile nav focus trap, reduced-motion guard for the hero video, event rendering, and footer year.

## Assets
- Hero video files go in `src/assets/video/hero.mp4` and `src/assets/video/hero.webm`.
- The hero/poster image lives at `src/assets/img/hero/poster.jpg`. Update this if you change video footage.
- Logo: `src/assets/img/hero/logo.svg`.
- Add community partner logos to `src/assets/img/` and swap them into the Support page grid when ready.

## Accessibility, SEO, Performance
- Layout includes a skip link, semantic sections, accessible mobile nav, and focus-visible styling.
- `prefers-reduced-motion` pauses the hero video and disables the parallax fixed background.
- Per-page metadata feeds Open Graph and Twitter tags via the base layout.
- `src/sitemap.njk` generates `/sitemap.xml`; `src/robots.txt` is copied as-is.
- Keep alt text meaningful, open external links with `target="_blank" rel="noopener"`, and aim for Lighthouse >= 95 across all categories before launch.

## Deployment
- Netlify config (`netlify.toml`) sets the build command (`npm run build:prod`), publish directory (`dist/`), and a sample redirect.
- Run `npm run build`, then publish `dist/` directly with the Netlify CLI or the `npm run deploy` helper.
- Production builds now run `npm run verify:build` after the Eleventy build to block legacy `/pages/` output or snapshot references from being deployed.
- `scripts/build-snapshot.mjs` is archival only. Do not use it as a deployment path.
- The verifier also blocks GitHub Pages deployment patterns in `.github/workflows/` and a root `CNAME` file.
- Subscribe submissions are proxied through `netlify/functions/subscribe-proxy.js` and forwarded to the admin Netlify function endpoint.
- The contact-page virtual programming form uses the same `subscribe-proxy.js` workflow, with virtual-content preferences selected by default.
- `npm run deploy` builds the site and publishes the finished `dist/` directory directly to the linked Netlify project, including local functions from `netlify/functions`.
- Public site Netlify environment variables:
  - `ADMIN_PUBLIC_SUBSCRIBE_URL` (e.g. `https://cyp-admin.netlify.app/.netlify/functions/public-subscribe`)
  - `PUBLIC_SUBSCRIBE_SHARED_SECRET` (must exactly match admin site's `PUBLIC_SUBSCRIBE_SHARED_SECRET`)
  - `PUBLIC_SUBSCRIBE_SOURCE` (optional, defaults to `www.iowacyp.com`)
  - `PUBLIC_SUBSCRIBE_RATE_LIMIT_WINDOW_MS` (optional, default `600000`)
  - `PUBLIC_SUBSCRIBE_RATE_LIMIT_MAX` (optional, default `20`)
  - `PUBLIC_VIRTUAL_PROGRAMMING_SOURCE` (optional, defaults to `www.iowacyp.com`)
  - `PUBLIC_VIRTUAL_PROGRAMMING_RATE_LIMIT_WINDOW_MS` (optional, default `600000`)
  - `PUBLIC_VIRTUAL_PROGRAMMING_RATE_LIMIT_MAX` (optional, default `20`)

## Updating Copy and Links
- Maintain one `<h1>` per page with descending headings.
- Refresh `src/data/site.json` for:
  - `site.links.eventsSubscribe` (replace the default mailto with the live subscribe form)
  - `site.links.scholarshipDatabase` (final scholarship database URL)
  - `site.links.appStore` and `site.links.googlePlay` (app badge links)
  - Any partner, volunteer, or program inquiry forms
- Update `src/data/events.json` with new titles, ISO dates (`YYYY-MM-DD`), times, locations, CTA URLs, and `"full": true` for events that have hit capacity. The script displays CTAs as external links when URLs start with `http`.
- Add partner logos to the Support page once brand assets are cleared.

With those pieces in place, rebuild (`npm run build`) and deploy `dist/` to Netlify or your preferred static host.
