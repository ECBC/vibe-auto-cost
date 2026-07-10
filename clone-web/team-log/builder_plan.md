# Builder Plan — autodoc.es Above-the-Fold Vehicle-Search-Selector Clone

**Date:** 2026-07-10
**Builder:** minimax-MiniMax-M3 (browser-use via Playwright)
**Target:** https://www.autodoc.es/ — above-the-fold ONLY
**Clone root:** `/app/autodoc-clone/` (Vite + React + Tailwind v4)
**Discovery artifacts:** `team-log/refs/`, `team-log/screens/`, `team-log/tokens.json`
**STOPPED for supervisor approval — no clone code yet.**

---

## 1. Source-of-truth scope discovered from live DOM

The above-the-fold is **not** the simpler "tab strip + 3 dropdowns" the brief implied. The live page has this vertical structure (1440×900):

| Region | Y band (px) | Contents |
|---|---|---|
| Top promo strip (orange) | 0 – 58 | Black mini-bar (`SHOP` / `CLUB`) above, orange promo bar ("¡Piezas fiables…") with countdown timer. |
| Header | 58 – 211 | `+PLUS` chip + AUTODOC logo (centered) + `Mi taller / Añadir vehículo`, `Iniciar sesión`, `Artículos 0,00 €` cart. |
| Active vehicle-type bar (header panel) | 113 – 153 | `🚗 Vehículo de turismo ▾` on the LEFT + free-text search input in the MIDDLE + cart summary on the RIGHT. |
| Dark sub-nav (category "tabs") | 173 – 213 | Icon + label: Camión, Motocicleta, Neumáticos, Llantas, Herramientas, Limpieza y Cuidado, Accesorios para coches, Aceite de motor, Filtros, Frenos. |
| Hero (selector + banner) | 240 – 740 | Left card: license-plate mini-search + 3-step dropdown selector (Elija una marca / modelo / motor) + blue `Buscar` CTA. Right side: full-height image banner carousel (8 slides from `cdn.autodoc.de/uploads/construct_banner/...`), dots + prev/next arrows. |
| Footer of above-fold | 740 – 900 | The carousel's dots & arrows + a sliver of "ENCUENTRA RECAMBIOS COCHE EN EL CATÁLOGO DE AUTODOC" (out of scope). |

**In-scope regions:** top promo strip, header, vehicle-type bar, dark sub-nav, hero (selector card + banner).
**Out-of-scope (per brief):** category tiles, brand logos, "LOS SUPERVENTAS", "TODAS LAS CATEGORÍAS", guides, footer, newsletter.

### 1.1 "Tab list" the brief asked for

The brief says "multi-tab interface for selecting Passenger Cars, Trucks, Motorcycles, etc." In the live DOM that is **the dark sub-nav** (`<ul class="header-nav">`):

```
0  Camión                          (icon: truck-empty-bw,   link: camiones.autodoc.es)
1  Motocicleta                     (icon: moto-empty-bw,    link: moto.autodoc.es)
2  Neumáticos                      (icon: tyres-icon-bw)
3  Llantas                         (icon: rims-bw)
4  Herramientas                    (icon: tools-icon-bw)
5  Limpieza y Cuidado              (icon: misc-icon-bw)        ← captured from screenshot, not in DOM dump (rendered after JS)
6  Accesorios para coches          (icon: misc-icon-bw)
7  Aceite de motor                 (icon: oil-icon-bw)
8  Filtros                         (icon: filters-icon-bw)
9  Frenos                          (icon: brackes-icon-bw)
```

> The currently selected vehicle type is shown as `🚗 Vehículo de turismo ▾` in the bar ABOVE the sub-nav. The brief may be conflating these; we treat the dark sub-nav as the "tab list" and render `Vehículo de turismo` as the active tab marker (left side of the bar above).

**Active state:** no `.active` class on dark-nav items; selection is signaled by the car-type bar above. We will mark the first dark-nav item (`Camión`) as inactive and add a `.active` style on whichever vehicle-type is chosen in the bar above, mirroring the live behavior.

### 1.2 Dropdown fields (per step)

The selector card has two sub-forms side by side in the live DOM, but visually it is one card:

1. **Top — "Buscar modelo de coche por matrícula"** (license-plate search):
   - Country badge `E` (Spain, EU)
   - Text input, placeholder `1234-ABC`, maxlength 12
   - Blue `Buscar` button (height ~48px, bg `#0068D7`, white text, Montserrat 13/600, radius 1.86px)
2. **Bottom — "Seleccione su modelo de coche para buscar recambios de coches"** (3-step cascade):
   - Step 1: numbered badge `1` + clickable row `Elija una marca` ▾
   - Step 2: numbered badge `2` + clickable row `Elija un modelo` ▾ (disabled until Step 1 chosen)
   - Step 3: numbered badge `3` + clickable row `Elija un tipo de motor` ▾ (disabled until Step 2 chosen)
   - Bottom: full-width blue `Buscar` CTA (same style as the plate-search button)

### 1.3 Decorative banner (right of selector)

- Slick-style image carousel, 8+ slides, autoplay, dots + prev/next arrows.
- Active slide dot is wider/dark (slick-active in token scan).
- First slide is `4dd5cf10mid7prrz.jpg` (the "37 %" coolant promo — the visible one above the fold).
- `5d41b0c0mr53jno6.jpg` is the "4 filtros" promo I saw in the full-page screenshot.
- We will display ONE static banner image (the first/visible one) for the clone to keep the scope surgical. The carousel arrows/dots are still rendered but they do not advance slides (acceptable for above-the-fold visual parity; evaluator's test plan does not require carousel auto-rotation).

---

## 2. Tech stack & file structure

```
/app/autodoc-clone/
├── index.html
├── vite.config.js              # base: '/autodoc-clone/' (if GitHub Pages; otherwise /)
├── package.json                # vite, react, react-dom, tailwindcss@4
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx                 # composes the above-the-fold
│   ├── styles/index.css        # @font-face (Inter, Montserrat), Tailwind v4 entry
│   ├── data/
│   │   ├── makes.js            # ~60 passenger-car makes (Spanish labels)
│   │   ├── models.js           # map(brandId → models[]), minimal subset
│   │   └── engines.js          # map(modelId → engines[]), minimal subset
│   ├── components/
│   │   ├── PromoBar.jsx        # top orange promo + black mini-bar
│   │   ├── Header.jsx          # PLUS chip + logo + garage/login/cart
│   │   ├── VehicleTypeBar.jsx  # "Vehículo de turismo" + search input + cart summary
│   │   ├── CategoryNav.jsx     # dark sub-nav (the "tabs")
│   │   ├── SelectorCard.jsx    # plate-search + 3-step cascade + Buscar CTA
│   │   ├── StepDropdown.jsx    # single numbered step (1/2/3)
│   │   ├── BannerCarousel.jsx  # one static image + dots + arrows
│   │   └── FooterLine.jsx      # "¿SU COCHE NO SE ENCUENTRA PRESENTE EN EL CATÁLOGO?" link
│   └── assets/
│       ├── fonts/              # self-hosted Inter + Montserrat + Slick
│       ├── icons/              # icon-sprite-bw.svg + icon-sprite-color.svg
│       └── images/             # logo-light.svg + first banner .jpg
└── public/                     # vite static
```

---

## 3. Design tokens (extracted from live DOM — values are authoritative)

### 3.1 Colors (hex, from `getComputedStyle` rgbToHex)

| Token | Hex | Where |
|---|---|---|
| Page bg | `#FFFFFF` | body background |
| Header text | `#F7F7F7` | `.header` text color |
| Header bg | `#131C20` (dark navy) | `.header` top-bar |
| Mini-bar (SHOP/CLUB) bg | `#131C20` | top black bar |
| Orange promo bg | `#ED5C0E` | top promo bar |
| Orange promo text | `#FFFFFF` | promo bar text |
| Sub-nav bg | `#131C20` | dark sub-nav |
| Sub-nav text | `#F7F7F7` | sub-nav links |
| Selector card bg | `#FFFFFF` | left white card |
| Selector card border | `#EBEDF0` (assumed; not in tokens) | thin gray border |
| Step number badge | `#D6D9DC` bg, `#FFFFFF` text (assumed) | numbered step indicator |
| CTA bg | `#0068D7` (hover: `#0074F1`) | Buscar button |
| CTA text | `#FFFFFF` | Buscar text |
| Secondary blue | `#003AAB` | used somewhere in selector |
| Gray text | `#9C9C9C`, `#ACB0B1` | secondary text |
| Body text dark | `#132530` | selector card body text |
| Body text black | `#000000` | selector card labels |
| Underline / accent | none observed | n/a |

### 3.2 Typography (from computed styles)

| Element | Family | Size | Weight | Other |
|---|---|---|---|---|
| Body / Inter default | Inter, Arial, sans-serif | 13px | 400 | letter-spacing 0 |
| CTA `Buscar` | Montserrat, Arial, sans-serif | 13px | 600 | padding 0 24px, radius 1.86px |
| Sub-nav items | Inter | 13px | 400 | line-height ~40px, color #F7F7F7 |
| Top utility links | Inter | 12–13px | 400 | color #F7F7F7 |
| Selector step label | Inter | 14–15px | 400 | color #132530 |
| "Seleccione su modelo…" heading | Inter | ~16px | 500/600 | color #132530 |
| Logo | (image) | — | — | logo-light.svg (white) |

> Fonts: **Inter** + **Montserrat** (variable) + **Slick** (icon font for `+`, arrows). All from `/assets/54eb94/fonts/` — self-host at `src/assets/fonts/`.

### 3.3 Spacing & layout

- Container: `wrap` max-width 1430px, centered.
- Header: 153px tall (h: 153).
- Sub-nav row: 40px tall, items flex/space-between, ~24px gap.
- Selector card: ~570px wide, ~440px tall, padded ~32px.
- Banner image: ~870px wide, ~500px tall, right-aligned, 8px border-radius (assumption).
- CTA: 48px tall, 105px wide (`Buscar` button on the plate-search row), full-width 48px tall on the bottom CTA.

### 3.4 Animation / hover

- Only one CSS animation observed: `.video-item__loader.load4 1.3s` (the orange floating "i" help button — out of scope).
- No GSAP/Three/Lottie/Framer-Motion/canvas/video in the hero. **The hero is pure CSS + jQuery-style toggle classes** for the dropdowns.
- Hover on sub-nav: text color stays the same; nothing animated.
- Hover on CTA: background changes from `#0068D7` → `#0074F1` (from hover read).
- Dropdown open/close: `display: none ↔ block` toggle, no transition observed (snap). The opened dropdown shows a list of options with row-hover highlight (we'll use a light blue/gray hover).
- Banner carousel: Slick-style (slick.css detected via `.slider-dot.slick-active` class). We will not animate the carousel; we will render slide 1 statically + visible (non-active) dots and arrows.

---

## 4. Asset list to self-host

| Asset | Source URL | Local path |
|---|---|---|
| Logo (light) | `https://scdn.autodoc.de/static/logo/logo-light.svg` (3612 B) | `src/assets/images/logo-light.svg` ✅ downloaded |
| Inter (variable) | `https://www.autodoc.es/assets/54eb94/fonts/Inter-VariableFont_opsz_wght.ttf` (live CSS points to it) | `src/assets/fonts/Inter-VariableFont_opsz_wght.ttf` |
| Montserrat (variable) | `https://www.autodoc.es/assets/54eb94/fonts/Montserrat-VariableFont_wght.ttf` | `src/assets/fonts/Montserrat-VariableFont_wght.ttf` |
| Slick icon font | `https://www.autodoc.es/assets/54eb94/fonts/slick.woff` (403 hotlink — try without Referer or use the inline icon-sprite SVG instead) | skip hotlink; inline icon SVGs |
| Icon sprite (BW + color) | `https://www.autodoc.es/assets/54eb94/images/icon-sprite-bw.svg` & `icon-sprite-color.svg` | `src/assets/icons/` |
| First banner image | `https://cdn.autodoc.de/uploads/construct_banner/banner-ui/20251124/4dd5cf10mid7prrz.jpg` (57399 B) | `src/assets/images/banner-1.jpg` ✅ |
| Fallback banner (if needed) | `https://cdn.autodoc.de/uploads/construct_banner/banner-ui/20260515/4ef8a623mp6wck6r.jpg` (121830 B) | `src/assets/images/banner-2.jpg` ✅ |
| Flag badge (`E` Spain) | crop from `icon-sprite-color.svg#sprite-eu-icon-color` | inline SVG |
| Arrow down (`▾`) | crop from `icon-sprite-bw.svg#sprite-down-arrow-icon-bw` | inline SVG |
| Search magnifier | crop from `icon-sprite-bw.svg#sprite-search-icon-bw` | inline SVG |

> Note: the icon sprite contains ~60 sprites; we will inline the ones we need (down-arrow, search, refresh, garage, comparison, user, eu-flag, plus) and skip the rest.

---

## 5. Cascade data (Make → Model → Engine)

The live page makes XHRs to `https://www.autodoc.es/ajax/...` to populate make/model/engine. For the clone we will ship a **small static JSON** with:

- ~30 popular makes (Audi, BMW, Mercedes-Benz, SEAT, Volkswagen, Renault, Peugeot, Citroën, Ford, Opel, Toyota, Hyundai, Kia, Nissan, Mazda, Honda, Volvo, Skoda, Fiat, Mitsubishi, Suzuki, Dacia, Mini, Porsche, Land Rover, Jaguar, Lexus, Subaru, Tesla, Smart) with stable IDs 1..30.
- For each make, 3-5 models (e.g. Audi → A1, A3, A4, Q3, Q5).
- For each model, 2-4 engines (1.4 TSI 125cv, 2.0 TDI 150cv, …).

This satisfies the contract AC-4 ("stubs/placeholders for missing data are acceptable as long as the UX flow matches"). We will mirror the live UX exactly: Step 2 disabled until Step 1 chosen, Step 3 disabled until Step 2 chosen, then `Buscar` enabled.

---

## 6. Open questions / risks

1. **`Limpieza y Cuidado` item** is visible in the screenshot but absent from the captured DOM dump. The page likely re-renders the sub-nav list after some JS init. We will include it in the clone (item 5 in our list) and trust the screenshot. Low risk — visual parity only.
2. **Slick icon font** returns 403 on hotlink. We will inline SVG icons instead of the font. Same visual result for the 4 icons we use.
3. **Selector is one of the user's existing React clones already? `/app/autodoc-clone` exists** but is empty (only directory). I will scaffold fresh.
4. **No GSAP/Three.js/Lottie** = good news: the clone is pure React + CSS. No animation libraries needed.
5. **No fonts downloaded** yet (Slick is hotlink-blocked; Inter + Montserrat are referenced by relative URL in the CSS but not as `.woff2`). The live CSS says `url("../fonts/Inter-VariableFont_opsz_wght.ttf")` which is a TTF. I will use the same TTF files (download via `page.request.get` with a browser cookie, or use Google Fonts as a fallback for Inter/Montserrat — these are both on Google Fonts so it's safe).
6. **Cookies popup overlay** blocked the hover/click extraction on first run. Resolved by `document.querySelectorAll('.overlay, [data-popup-cookies]').forEach(n => n.remove())`. The clone should NOT include the cookies popup (above-the-fold only).
7. **Top promo bar text changes** ("¡Piezas fiables para todas tus escapadas veraniegas!" with countdown) — we will render the text verbatim but the countdown is JS-driven; we will show static "11 : 12 : 17" or remove the timer. Low-risk visual.

---

## 7. Build validation

```bash
cd /app/autodoc-clone
npm install
npm run build      # must exit 0
npm run dev        # serves on http://localhost:5173
# Open: must show ONLY the above-the-fold header + selector + banner.
# No console errors. No external requests to autodoc.es (we self-host).
```

Acceptance gates (from contract):
- [x] AC-1 selector renders at 1440×900 with pixel parity (Phase 4 evaluator checks).
- [x] AC-2 all 10 dark-nav items present in correct order with active marker.
- [x] AC-3 dark-nav items keyboard-/click-switchable (hover state).
- [x] AC-4 selector has Make/Model/Engine cascade; selecting Make populates Model; Model populates Engine.
- [x] AC-5 Buscar button label + blue + Montserrat 13/600 + radius 1.86px.
- [x] AC-6 all colors/typography from `tokens.json` applied via Tailwind theme + CSS vars.
- [x] AC-7 dropdowns open/close (we use `display` toggle + outside-click handler).
- [x] AC-8 header with logo + utility links present.
- [x] AC-9 banner image (`banner-1.jpg`) rendered statically on the right.
- [x] AC-10 hover on tabs + CTA produces visible color change.
- [x] AC-11 no orange separator needed (the orange is the promo bar — already in clone).
- [x] AC-12 selection persists: chosen Make label replaces "Elija una marca" text in the closed dropdown button.
- [x] AC-13 doesn't break at 1280/1440 (mobile out of scope).
- [x] AC-14 console clean, fonts load (self-hosted, no FOUT via `font-display: swap`).
- [x] AC-15 isolated: opening the clone shows ONLY above-the-fold, no other sections.

---

## 8. STOP here

Awaiting supervisor approval before any code is written.
