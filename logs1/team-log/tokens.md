# Tokens Sheet — autodoc.es Above-the-Fold

Source: live DOM, Playwright Chromium 149, viewport 1440×900, locale es-ES.
Run: `NODE_PATH=/app/node_modules node /app/clone-web/discover.mjs` (writes `tokens.json`).
Full screenshot set: `team-log/screens/orig_{1440x900_settled,1440x900_full,1920x1080_settled,390x844_settled}.png`.
Live HTML: `team-log/refs/autodoc_live.html` (582 KB) and `above_fold_dom.html` (24 KB).

## Colors
| Token | Hex |
|---|---|
| page-bg | `#FFFFFF` |
| header-bg / mini-bar-bg / subnav-bg | `#131C20` |
| header-text / subnav-text | `#F7F7F7` |
| promo-bar-bg (orange) | `#ED5C0E` |
| cta-bg (rest) | `#0068D7` |
| cta-bg (hover) | `#0074F1` |
| cta-text | `#FFFFFF` |
| secondary-blue | `#003AAB` |
| body-text-dark | `#132530` |
| body-text | `#000000` |
| gray-muted | `#9C9C9C` |
| gray-line | `#ACB0B1` |
| gray-light | `#343434` |

## Typography
| Use | Family | Size | Weight |
|---|---|---|---|
| Body / Inter | Inter, Arial, sans-serif | 13px | 400 |
| CTA Buscar | Montserrat, Arial, sans-serif | 13px | 600 |
| Subnav items | Inter | 13px | 400 |
| Top utility links | Inter | 12–13px | 400 |
| Selector card heading | Inter | ~16px | 500 |
| Selector step label | Inter | 14–15px | 400 |

> Slick icon font referenced by `slider-dot` class — 403 on hotlink; we inline SVGs.

## Layout
- wrap: max-width 1430px, centered (`mx-auto`)
- header: 153px tall
- subnav row: 40px tall, gap ~24px
- selector card: 570×440, padded 32px
- banner: 870×500, right-aligned

## Tabs (dark sub-nav, `ul.header-nav`)
| # | Label | Icon | Link |
|---|---|---|---|
| 0 | Camión | truck-empty-bw | camiones.autodoc.es |
| 1 | Motocicleta | moto-empty-bw | moto.autodoc.es |
| 2 | Neumáticos | tyres-icon-bw | /neumaticos |
| 3 | Llantas | rims-bw | /llantas |
| 4 | Herramientas | tools-icon-bw | (link) |
| 5 | Limpieza y Cuidado | misc-icon-bw | (link) |
| 6 | Accesorios para coches | misc-icon-bw | /accesorios-para-coches |
| 7 | Aceite de motor | oil-icon-bw | /aceite-de-motor |
| 8 | Filtros | filters-icon-bw | /filtros |
| 9 | Frenos | brackes-icon-bw | /frenos |

> Active vehicle type ("Vehículo de turismo") is shown ABOVE the sub-nav in the vehicle-type bar; no `.active` class on dark-nav items.

## Dropdown steps
1. `Elija una marca` ▾ (searchable, opens listbox)
2. `Elija un modelo` ▾ (disabled until step 1)
3. `Elija un tipo de motor` ▾ (disabled until step 2)

CTA: full-width blue `Buscar` below the cascade.

## Animation tech
- No GSAP, Three.js, Lottie, Rive, Framer-Motion, canvas, or video detected in the hero.
- Carousel is **slick** (class `slider-dot slick-active`).
- Only CSS animation in scope: `.video-item__loader.load4 1.3s` (out-of-scope help button).
- Hover: CTA bg `#0068D7` → `#0074F1`.

## Assets downloaded
- `assets/logo/logo-light.svg` (3612 B) — header logo (white)
- `assets/banner/4dd5cf10mid7prrz.jpg` (57399 B) — first/visible banner (37% coolant)
- `assets/banner/55eb03b2mrdmc439.jpg` (127099 B) — fallback banner
- `assets/banner/4ef8a623mp6wck6r.jpg` (121830 B) — fallback banner
- `assets/banner/49756e81mr3q5y8k.jpg` (124993 B) — fallback banner
- `assets/banner/logo-light.svg` (3612 B) — accidentally also written here; will move during build.

> Inter + Montserrat: will use Google Fonts CDN as fallback (slick woff is hotlink-blocked; we'll inline the ~6 SVG icons we need).
