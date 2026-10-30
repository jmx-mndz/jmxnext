# JMX — Jonathan Mendoza portfolio

Premium 3D portfolio. Static HTML / CSS / JS — no build step. Upload the whole folder to GitHub Pages (or any static host) as-is.

## Folder structure

```
index.html  work.html  automation.html  amazon.html  creative.html  about.html  contact.html
CNAME

css/
  global.css        shared design system: tokens, type, nav + mobile drawer, loader, cursor,
                    buttons, reveals, lightbox, video modal, Reed case study, gallery, CTA, footer
  home.css  work.css  automation.css  amazon.css  creative.css  about.css  contact.css

js/
  global.js         shared behaviour: loader, smooth scroll, nav + mobile drawer, cursor, magnetic
                    buttons, split-text reveals, tilt, parallax, counters, lightbox, video modal, gallery
  data.js           portfolio data — HVAC / roofing / Garage Rooms creatives, website builds, highlights
  home.js  work.js  automation.js  amazon.js  creative.js  about.js  contact.js

assets/
  brand/            logos + favicons
  logos/            tool logos (incl. Yelp)
  docs/             Precision Appliance Repair case study PDF
  video/            reels (H.264, 720p, web-optimised) + covers/
  img/
    profile/        portrait
    builds/         desktop/ + mobile/ screenshots for every website build
    creative/       hvac/  roofing/ (new-set/, memes/)  garage-rooms/  reed/
    automation/     GHL / Zapier / Make screenshots + precision/
    amazon/  proof/  social/
```

## What's on each page

| Page       | Sections (in order) · signature 3D / motion |
|------------|---------------------------------------------|
| Home       | Infinite portal-frames hero (Three.js) · 3D kinetic type ring · About · Four disciplines · Tools & platforms (tilted 3D deck, incl. Yelp) · Website builds (scroll-driven 3D browser stack + phone, 7 sites incl. IsaPlus + Lovesick) · Reed Brothers case · Creative orbit · Automation cover flow · Amazon card stack · Social system · CTA |
| Work       | Rotating gallery wall · Website builds (hover-to-expand) · Reed case · Creative library · Automation · Amazon |
| Automation | Live workflow graph · Precision Appliance case study (scroll-assembled 3D screenshots, tilting stats, 3D journey) · GHL workflows · Voice AI · Zaps · Make |
| Creative   | Parallax hero · Reed Brothers case (first) · 5 auto-playing video reels in 3D cover flow · Ignite Agency Garage Rooms scroll-fanned 3D deck · Horizontal scroll gallery · Full library (HVAC / Roofing / Garage Rooms) |
| About      | 3D portrait · Story · Experience (current + previous roles) · Client feedback |
| Contact    | Glass service cube · WhatsApp / email / phone / LinkedIn / Instagram · Inquiry form |

Libraries (CDN): Lenis 1.1.13 (smooth scroll), Three.js r128 (home hero only).
No WebGL → CSS fallback. Reduced motion → animations off, videos stay paused on their covers.

## Editing content

- Creatives, website builds and homepage highlights live in `js/data.js`.
- To add a website build: drop a desktop screenshot in `assets/img/builds/desktop/`, a mobile one in `assets/img/builds/mobile/`, and add an entry to `builds` in `js/data.js` (it appears on Home and Work automatically).
- To add a reel: put the `.mp4` in `assets/video/` and its cover in `assets/video/covers/`, then copy one `.reel` block in `creative.html`. Keep videos ~720p H.264 so they autoplay smoothly.
- The Reed Brothers case-study markup appears on Home, Work and Creative — edit all three if numbers change.
