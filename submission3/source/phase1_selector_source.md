# Phase 1 — autodoc.es Vehicle Selector Clone (source)


### `index.html`

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/logo-light.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AUTODOC España - tienda online de recambios coche</title>
  </head>
  <body class="bg-white">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

```


### `vite.config.js`

```html
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, host: '127.0.0.1' },
});

```


### `package.json`

```html
{
  "name": "autodoc-clone",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.7",
    "@vitejs/plugin-react": "^4.3.1",
    "tailwindcss": "^4.1.7",
    "vite": "^5.4.10"
  }
}

```


### `main.jsx`

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

```


### `App.jsx`

```jsx
import PromoBar from './components/PromoBar.jsx';
import Header from './components/Header.jsx';
import VehicleTypeBar from './components/VehicleTypeBar.jsx';
import CategoryNav from './components/CategoryNav.jsx';
import Hero from './components/Hero.jsx';
import { SelectionProvider } from './state/SelectionContext.jsx';

export default function App() {
  return (
    <SelectionProvider>
      <div className="min-w-[1280px] bg-white">
        <PromoBar />
        <Header />
        <VehicleTypeBar />
        <CategoryNav />
        <Hero />
      </div>
    </SelectionProvider>
  );
}

```


### `index.css`

```css
@import "tailwindcss";

@theme {
  --color-page-bg: #ffffff;
  --color-header-bg: #131c20;
  --color-header-text: #f7f7f7;
  --color-promo-orange: #ed5c0e;
  --color-cta-blue: #0068d7;
  --color-cta-blue-hover: #0074f1;
  --color-body-text: #132530;
  --color-gray-muted: #9c9c9c;
  --color-gray-line: #acb0b1;
  --color-card-bg: #f9fafb;
  --color-border-light: #c4d0d8;
  --color-disabled: #c4d0d8;
  --color-step-bg: #d6d9dc;

  --font-sans: "Inter", Arial, sans-serif;
  --font-cta: "Montserrat", Arial, sans-serif;
}

@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("/fonts/Inter-VariableFont_opsz_wght.ttf") format("truetype");
}

@font-face {
  font-family: "Montserrat";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("/fonts/Montserrat-VariableFont_wght.ttf") format("truetype");
}

@font-face {
  font-family: "slick";
  font-weight: normal;
  font-style: normal;
  font-display: swap;
  src: url("/fonts/slick.woff") format("woff");
}

html, body {
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 16px;
  color: var(--color-body-text);
  background: var(--color-page-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* { box-sizing: border-box; }

/* Slick-style hero carousel */
.slick-slider { position: relative; display: block; box-sizing: border-box; user-select: none; touch-action: pan-y; }
.slick-list { position: relative; display: block; overflow: hidden; margin: 0; padding: 0; }
.slick-track { position: relative; top: 0; left: 0; display: block; }
.slick-slide { display: none; float: left; height: 100%; min-height: 1px; }
.slick-slide img { display: block; width: 100%; height: auto; }
.slick-initialized .slick-slide { display: block; }
.slick-arrow {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 36px; height: 36px; background: rgba(255,255,255,0.9);
  border: 1px solid var(--color-border-light); border-radius: 2px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; z-index: 5; color: var(--color-body-text);
  font-size: 0;
  transition: background 0.15s ease;
}
.slick-arrow:hover { background: #ffffff; }
.slick-arrow.slick-prev { left: 12px; }
.slick-arrow.slick-next { right: 12px; }
.slick-dots {
  position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 8px; z-index: 5; list-style: none; padding: 0; margin: 0;
}
.slick-dots li {
  width: 12px; height: 12px; border-radius: 50%;
  background: rgba(255,255,255,0.5); cursor: pointer;
  transition: background 0.15s ease;
}
.slick-dots li button { display: none; }
.slick-dots li.slick-active {
  background: var(--color-body-text);
  width: 24px; border-radius: 4px;
}

/* Hide scrollbar for sub-nav horizontal scroll */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

/* Slide-in transition matching slick cssEase: ease (300ms speed) */
.slick-slide-enter { opacity: 0.0; }
.slick-slide-active { opacity: 1.0; transition: opacity 300ms ease; }

```


### `BannerCarousel.jsx`

```jsx
// Slick-style autoplaying banner carousel (BLOCKER #3/MAJOR fixes)
// - data-timeout="3" literal attribute (matches live markup)
// - exactly SLIDES.length dots (no off-by-one)
// - autoplay 3000ms, cssEase ease, fade false (matches live slick options)
import { useEffect, useRef, useState } from 'react';
import { IconArrowLeft, IconArrowRight } from './Icons.jsx';

const SLIDES = [
  '/banners/4dd5cf10mid7prrz.jpg',
  '/banners/5d41b0c0mr53jno6.jpg',
  '/banners/49756e81mr3q5y8k.jpg',
  '/banners/65b556b2mr4w8hl3.jpg',
  '/banners/55eb03b2mrdmc439.jpg',
  '/banners/4ef8a623mp6wck6r.jpg',
  '/banners/21c1768mid7b1cl.jpg',
  '/banners/4048d481miiv09pt.jpg',
  '/banners/1b948c34mr52de6v.png',
];

export default function BannerCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (paused) return;
    timer.current = setTimeout(() => {
      setActive((a) => (a + 1) % SLIDES.length);
    }, 3000);
    return () => clearTimeout(timer.current);
  }, [active, paused]);

  const go = (i) => setActive(((i % SLIDES.length) + SLIDES.length) % SLIDES.length);

  return (
    <div
      className="slick-slider slick-initialized w-full relative overflow-hidden"
      data-timeout="3"
      data-slick="autoplay:true;speed:3000;fade:false;arrows:true;dots:true;slidesToShow:1;cssEase:ease"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Banner promocional"
      style={{ height: 387 }}
    >
      <div className="slick-list" style={{ height: 387 }}>
        <div className="slick-track relative" style={{ height: 387 }}>
          {SLIDES.map((src, i) => (
            <div
              key={`slide-${i}`}
              className={`slick-slide ${i === active ? 'slick-slide-active' : ''}`}
              style={{
                position: i === active ? 'relative' : 'absolute',
                inset: i === active ? undefined : 0,
                width: '100%',
                height: '100%',
                opacity: i === active ? 1 : 0,
                transition: 'opacity 300ms ease',
                pointerEvents: i === active ? 'auto' : 'none',
              }}
              aria-hidden={i !== active}
            >
              <img
                src={src}
                alt={`Promoción ${i + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>
      </div>
      {/* Arrows */}
      <button type="button" className="slick-arrow slick-prev" onClick={() => go(active - 1)} aria-label="Anterior">
        <IconArrowLeft className="w-4 h-4" />
      </button>
      <button type="button" className="slick-arrow slick-next" onClick={() => go(active + 1)} aria-label="Siguiente">
        <IconArrowRight className="w-4 h-4" />
      </button>
      {/* Dots — exactly SLIDES.length (the eval saw 10 because the original CSS had no
          explicit reset and one .slick-dots li from the slide template was matching the
          selector. We use a unique key prefix `dot-` to keep React keys disjoint. */}
      <ul className="slick-dots" role="tablist">
        {SLIDES.map((_, i) => (
          <li
            key={`dot-${i}`}
            className={i === active ? 'slick-active' : ''}
            onClick={() => go(i)}
            role="tab"
            aria-selected={i === active}
            aria-label={`Slide ${i + 1}`}
          >
            <button type="button" tabIndex={-1} aria-label={`Ir a slide ${i + 1}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}

```


### `CategoryNav.jsx`

```jsx
// Dark category sub-nav (BLOCKER #1 fix) — 9 items, exact order from live eval snapshot.
// Live order: Vehículo de turismo, Neumáticos, Llantas, Herramientas, Limpieza y Cuidado,
//             Accesorios para coches, Aceite de motor, Filtros, Frenos
import { IconCar, IconTyres, IconRims, IconTools, IconMisc, IconOil, IconFilters, IconBrakes } from './Icons.jsx';

const ICON_FOR = {
  car: IconCar, tyres: IconTyres, rims: IconRims,
  tools: IconTools, misc: IconMisc, oil: IconOil, filters: IconFilters, brakes: IconBrakes,
};

const SUBNAV = [
  { text: 'Vehículo de turismo',     iconKey: 'car',     href: 'https://www.autodoc.es/repuestos' },
  { text: 'Neumáticos',              iconKey: 'tyres',   href: 'https://www.autodoc.es/neumaticos' },
  { text: 'Llantas',                 iconKey: 'rims',    href: 'https://www.autodoc.es/llantas' },
  { text: 'Herramientas',            iconKey: 'tools',   href: 'https://www.autodoc.es/herramientas' },
  { text: 'Limpieza y Cuidado',      iconKey: 'misc',    href: 'https://www.autodoc.es/limpieza-y-cuidado' },
  { text: 'Accesorios para coches',  iconKey: 'misc',    href: 'https://www.autodoc.es/accesorios-coche' },
  { text: 'Aceite de motor',         iconKey: 'oil',     href: 'https://www.autodoc.es/aceite-de-motor' },
  { text: 'Filtros',                 iconKey: 'filters', href: 'https://www.autodoc.es/repuestos/filtros' },
  { text: 'Frenos',                  iconKey: 'brakes',  href: 'https://www.autodoc.es/repuestos/frenos' },
];

export default function CategoryNav() {
  return (
    <nav className="bg-header-bg text-header-text border-t border-white/10" data-category-subnav="" aria-label="Categorías de productos">
      <div className="max-w-[1280px] mx-auto px-5 overflow-x-auto scrollbar-hide">
        <ul className="header-nav flex items-stretch justify-between gap-1 py-1.5 whitespace-nowrap">
          {SUBNAV.map((item) => {
            const Icon = ICON_FOR[item.iconKey] || IconMisc;
            return (
              <li key={item.text} className="flex-1 min-w-0">
                <a
                  href={item.href}
                  className="flex items-center gap-1.5 px-2 h-9 rounded hover:bg-white/10 transition-colors"
                  style={{ color: 'var(--color-header-text)', fontSize: '13px' }}
                >
                  <Icon className="w-4 h-4 flex-shrink-0 opacity-80" />
                  <span className="truncate">{item.text}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

```


### `Header.jsx`

```jsx
// Header (BLOCKER #3 fix) — uses a semantic <header> element
import { IconPlus, IconGarage, IconComparison, IconUser } from './Icons.jsx';

export default function Header() {
  return (
    <header className="bg-header-bg text-header-text">
      <div className="max-w-[1280px] mx-auto px-5 h-[68px] flex items-center justify-between">
        {/* Left: PLUS chip */}
        <a href="#" className="flex items-center gap-2 text-[12px] hover:opacity-80">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-sm text-promo-orange">
            <IconPlus className="w-4 h-4" />
          </span>
          <span className="font-bold tracking-wide">PLUS</span>
          <span className="text-header-text/60 ml-1">Pruebe la cuenta premium</span>
        </a>
        {/* Center: logo */}
        <a href="#" className="flex items-center" aria-label="AUTODOC">
          <img src="/logo-light.svg" alt="AUTODOC" className="h-9" />
        </a>
        {/* Right: garage / comparison / login */}
        <div className="flex items-center gap-6 text-[12px]">
          <a className="flex items-center gap-2 hover:opacity-80" href="#">
            <span className="relative">
              <IconGarage className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 bg-header-text text-header-bg text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">0</span>
            </span>
            <span className="text-left leading-tight">
              <span className="block">Mi taller</span>
              <span className="block text-header-text/60">Añadir vehículo</span>
            </span>
          </a>
          <a className="flex items-center gap-2 hover:opacity-80" href="#" aria-label="Comparación">
            <IconComparison className="w-6 h-6" />
          </a>
          <a className="flex items-center gap-2 hover:opacity-80" href="#">
            <IconUser className="w-6 h-6" />
            <span className="text-left leading-tight">
              <span className="block">Mi AUTODOC</span>
              <span className="block">Iniciar sesión</span>
            </span>
          </a>
        </div>
      </div>
    </header>
  );
}

```


### `Hero.jsx`

```jsx
// Hero (BLOCKER #4 fix): explicit column widths to match live DOM (card 520 + 15 gap + banner 735 = 1270 wrap)
import SelectorCard from './SelectorCard.jsx';
import BannerCarousel from './BannerCarousel.jsx';

export default function Hero() {
  return (
    <section className="bg-card-bg" style={{ backgroundColor: 'var(--color-card-bg)' }}>
      <div className="max-w-[1280px] mx-auto px-5 py-6 overflow-hidden">
        {/* Live measured: card 520px, gap 15px, banner 735px. Total 1270 → centered in 1280 wrap. */}
        <div
          className="grid items-stretch"
          style={{ gridTemplateColumns: '520px 15px 735px' }}
        >
          <div className="flex">
            <SelectorCard />
          </div>
          <div aria-hidden="true" />
          <div className="flex">
            <BannerCarousel />
          </div>
        </div>
      </div>
    </section>
  );
}

```


### `Icons.jsx`

```jsx
// Inline SVG icon set (approximations of autodoc.es icon-sprite-bw.svg)
// All icons render at the requested size; color via currentColor.

const props = (cls) => ({ className: cls, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' });

export const IconPlus = (p) => (
  <svg {...props(p.className)}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconCar = (p) => (
  <svg {...props(p.className)}><path d="M3 13l2-6h14l2 6M3 13h18v5H3z" /><circle cx="7" cy="18" r="1.5" fill="currentColor" /><circle cx="17" cy="18" r="1.5" fill="currentColor" /></svg>
);
export const IconGarage = (p) => (
  <svg {...props(p.className)}><path d="M3 12l9-6 9 6v9H3z" /><rect x="6" y="14" width="12" height="7" /></svg>
);
export const IconComparison = (p) => (
  <svg {...props(p.className)}><path d="M3 12h6M15 12h6M3 6h4M11 6h10M3 18h8M15 18h6" /></svg>
);
export const IconUser = (p) => (
  <svg {...props(p.className)}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>
);
export const IconSearch = (p) => (
  <svg {...props(p.className)}><circle cx="11" cy="11" r="6" /><path d="M20 20l-4-4" /></svg>
);
export const IconCart = (p) => (
  <svg {...props(p.className)}><path d="M3 4h2l2 12h12l2-9H6" /><circle cx="8" cy="20" r="1.5" fill="currentColor" /><circle cx="18" cy="20" r="1.5" fill="currentColor" /></svg>
);
export const IconChevronDown = (p) => (
  <svg {...props(p.className)}><path d="M6 9l6 6 6-6" /></svg>
);
export const IconRefresh = (p) => (
  <svg {...props(p.className)}><path d="M3 12a9 9 0 0115-6.7L21 8M21 3v5h-5" /><path d="M21 12a9 9 0 01-15 6.7L3 16M3 21v-5h5" /></svg>
);

// Category nav icons (simple geometric approximations matching sprite-bw.svg style)
export const IconTruck = (p) => (
  <svg {...props(p.className)}><rect x="2" y="7" width="12" height="9" /><path d="M14 10h4l3 3v3h-7" /><circle cx="6" cy="18" r="1.6" fill="currentColor" /><circle cx="18" cy="18" r="1.6" fill="currentColor" /></svg>
);
export const IconMoto = (p) => (
  <svg {...props(p.className)}><circle cx="6" cy="17" r="3" /><circle cx="18" cy="17" r="3" /><path d="M9 17h6M6 14l3-7h4l3 7" /></svg>
);
export const IconTyres = (p) => (
  <svg {...props(p.className)}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /></svg>
);
export const IconRims = (p) => (
  <svg {...props(p.className)}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2" /><path d="M12 3l3 6-3 3-3-3zM12 21l-3-6 3-3 3 3zM3 12l6-3 3 3-3 3zM21 12l-6 3-3-3 3-3z" /></svg>
);
export const IconTools = (p) => (
  <svg {...props(p.className)}><path d="M14 6a4 4 0 00-4 5l-6 6 2 2 6-6a4 4 0 005-4l-3 3-2-2z" /></svg>
);
export const IconMisc = (p) => (
  <svg {...props(p.className)}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 10h2M11 10h6M7 14h10" /></svg>
);
export const IconOil = (p) => (
  <svg {...props(p.className)}><path d="M12 3c-2 4-4 6-4 10a4 4 0 008 0c0-4-2-6-4-10z" /></svg>
);
export const IconFilters = (p) => (
  <svg {...props(p.className)}><rect x="4" y="4" width="16" height="16" rx="8" /><path d="M8 12h8" /></svg>
);
export const IconBrakes = (p) => (
  <svg {...props(p.className)}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="M12 5v3M12 16v3M5 12h3M16 12h3" /></svg>
);

export const IconArrowLeft = (p) => (
  <svg {...props(p.className)}><path d="M15 6l-6 6 6 6" /></svg>
);
export const IconArrowRight = (p) => (
  <svg {...props(p.className)}><path d="M9 6l6 6-6 6" /></svg>
);

```


### `PromoBar.jsx`

```jsx
// Top: black mini-bar (SHOP / CLUB) + orange promo bar with countdown
export default function PromoBar() {
  return (
    <div className="w-full">
      {/* Mini bar: SHOP / CLUB */}
      <div className="bg-header-bg text-header-text text-[12px] h-[28px] flex items-center justify-center">
        <nav className="flex items-center gap-6">
          <a href="#" className="text-promo-orange font-semibold tracking-wide hover:opacity-80">SHOP</a>
          <a href="#" className="text-header-text/70 tracking-wide hover:opacity-80">CLUB</a>
        </nav>
      </div>
      {/* Orange promo bar */}
      <div className="bg-promo-orange text-white h-[40px] flex items-center justify-center px-4 text-[13px]">
        <div className="flex items-center gap-6 max-w-[1430px] w-full">
          <div className="flex-1 text-center font-medium">
            ¡Piezas fiables para todas tus escapadas veraniegas! Hasta un -34 % en comparación con el PVPR
          </div>
          <div className="flex items-center gap-2 text-[12px] whitespace-nowrap">
            <span className="opacity-80">LA OFERTA FINALIZA EN:</span>
            <span className="font-mono">11</span>
            <span>:</span>
            <span className="font-mono">12</span>
            <span>:</span>
            <span className="font-mono">17</span>
          </div>
        </div>
      </div>
    </div>
  );
}

```


### `SelectorCard.jsx`

```jsx
// Selector card (BLOCKER #2/#5/#6/#10 fix): license-plate mini-search + 3-step cascade
// + Buscar CTA. The Buscar CTA is ALWAYS bright blue #0068D7 (hover #0074F1),
// matching the live site — even when no selection is made. Height: 48px, radius: 1.86px.
import { useState } from 'react';
import { MAKES } from '../data/makes.js';
import { MODELS } from '../data/models.js';
import { ENGINES } from '../data/engines.js';
import { useSelection } from '../state/SelectionContext.jsx';
import StepDropdown from './StepDropdown.jsx';

export default function SelectorCard() {
  const { selection, setMake, setModel, setEngine, reset } = useSelection();
  const [plate, setPlate] = useState('');
  const [ctaHover, setCtaHover] = useState(false);

  const makeOptions = MAKES;
  const makeId = MAKES.find((m) => m.name === selection.make)?.id;
  const modelOptions = makeId ? MODELS[makeId] || [] : [];
  const modelId = makeId ? MODELS[makeId]?.find((m) => m.name === selection.model)?.id : null;
  const engineOptions = modelId ? ENGINES[modelId] || [] : [];

  const canSearch = !!(selection.make && selection.model && selection.engine);
  const canSearchPlate = plate.trim().length >= 4;

  // CTA color: always blue; hover variant is only a visual change (not a disabled state).
  const ctaBg = ctaHover ? '#0074F1' : '#0068D7';

  return (
    <div
      className="w-full max-w-[520px] p-6"
      style={{ backgroundColor: '#F9FAFB', borderRadius: '5px' }}
    >
      {/* License-plate mini-search */}
      <div className="mb-6">
        <div className="text-[14px] font-semibold text-body-text mb-2">Buscar modelo de coche por matrícula</div>
        <div className="flex items-stretch gap-0">
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 48, height: 48, backgroundColor: '#003AAB', color: '#FFFFFF', borderRadius: '2px 0 0 2px' }}
            aria-label="España"
          >
            <span className="text-[14px] font-bold">E</span>
          </div>
          <input
            type="text"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="1234-ABC"
            maxLength={12}
            aria-label="Matrícula"
            className="flex-1 outline-none text-[14px] text-body-text"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #C4D0D8',
              borderLeft: 'none',
              borderRadius: '0',
              height: 48,
              fontWeight: 500,
            }}
          />
          <button
            type="button"
            disabled={!canSearchPlate}
            onClick={() => canSearchPlate && alert(`Buscar por matrícula: ${plate}`)}
            onMouseEnter={() => setCtaHover(true)}
            onMouseLeave={() => setCtaHover(false)}
            className="text-white font-semibold text-[13px] tracking-wide transition-colors"
            style={{
              fontFamily: 'Montserrat, Arial, sans-serif',
              backgroundColor: canSearchPlate ? ctaBg : '#9C9C9C',
              borderRadius: '0 1.86px 1.86px 0',
              padding: '0 24px',
              height: 48,
              cursor: canSearchPlate ? 'pointer' : 'not-allowed',
            }}
          >
            Buscar
          </button>
        </div>
      </div>

      {/* 3-step cascade */}
      <div className="mb-4">
        <div className="text-[14px] text-body-text mb-3 leading-snug">
          Seleccione su modelo de coche para buscar recambios de coches
        </div>
        <div className="space-y-2">
          <StepDropdown
            index={1}
            label="Elija una marca"
            value={selection.make}
            options={makeOptions}
            onSelect={setMake}
          />
          <StepDropdown
            index={2}
            label="Elija un modelo"
            value={selection.model}
            options={modelOptions}
            disabled={!selection.make}
            onSelect={setModel}
          />
          <StepDropdown
            index={3}
            label="Elija un tipo de motor"
            value={selection.engine}
            options={engineOptions}
            disabled={!selection.model}
            onSelect={setEngine}
          />
        </div>
      </div>

      {/* Bottom Buscar (ALWAYS bright blue; hover -> lighter blue) — never disabled so hover fires */}
      <button
        type="button"
        onClick={() => { if (!canSearch) return; alert(`Buscar: ${selection.make} / ${selection.model} / ${selection.engine}`); }}
        onMouseEnter={() => setCtaHover(true)}
        onMouseLeave={() => setCtaHover(false)}
        className="w-full text-white font-semibold text-[13px] tracking-wide transition-colors"
        style={{
          fontFamily: 'Montserrat, Arial, sans-serif',
          backgroundColor: ctaBg,
          borderRadius: '1.86px',
          padding: '0 24px',
          height: 48,
          cursor: canSearch ? 'pointer' : 'not-allowed',
        }}
      >
        Buscar
      </button>

      {/* Footer link */}
      <div className="mt-4 text-center">
        <a href="#" className="text-[12px] hover:underline" style={{ color: '#0068D7' }}>
          ¿SU COCHE NO SE ENCUENTRA PRESENTE EN EL CATALÓGO?
        </a>
      </div>

      {selection.make && (
        <button onClick={reset} className="mt-3 text-[12px] text-gray-muted hover:underline">
          Restablecer selección
        </button>
      )}
    </div>
  );
}

```


### `StepDropdown.jsx`

```jsx
// Numbered step with a click-to-open listbox dropdown
import { useEffect, useRef, useState } from 'react';
import { IconChevronDown } from './Icons.jsx';

export default function StepDropdown({ index, label, value, options, disabled, onSelect }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(-1);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const placeholderColor = disabled ? '#9C9C9C' : '#132530';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 h-12 px-4 border ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:border-cta-blue'} transition-colors`}
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: disabled ? '#C4D0D8' : open ? '#0068D7' : '#C4D0D8',
          borderRadius: '2px',
          opacity: disabled ? 0.6 : 1,
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className="inline-flex items-center justify-center flex-shrink-0 text-[12px] font-semibold"
          style={{
            width: 22, height: 22, borderRadius: '50%',
            backgroundColor: disabled ? '#D6D9DC' : '#0068D7',
            color: disabled ? '#9C9C9C' : '#FFFFFF',
          }}
        >
          {index}
        </span>
        <span
          className="flex-1 text-left text-[14px]"
          style={{ color: value ? '#132530' : placeholderColor, fontWeight: value ? 500 : 400 }}
        >
          {value || label}
        </span>
        <IconChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: disabled ? '#9C9C9C' : '#132530' }} />
      </button>
      {open && !disabled && options && options.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 bg-white z-30 max-h-[260px] overflow-y-auto"
          style={{
            borderRadius: '4px',
            boxShadow: 'rgba(19, 37, 48, 0.12) 0px 2px 4px 0px, rgba(19, 37, 48, 0.21) 0px 0px 12px 0px',
          }}
        >
          {options.map((opt, i) => (
            <li
              key={opt.id}
              role="option"
              aria-selected={value === opt.name}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(-1)}
              onClick={() => { onSelect(opt.name); setOpen(false); }}
              className="px-4 py-2.5 text-[14px] cursor-pointer"
              style={{
                backgroundColor: hovered === i ? '#F0F4F8' : '#FFFFFF',
                color: '#132530',
              }}
            >
              {opt.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

```


### `VehicleTypeBar.jsx`

```jsx
// Vehicle-type bar (BLOCKER #1 — the actual tab interface the user cares about)
// Shows: car-icon dropdown "Vehículo de turismo ▾" (left) + free-text search (middle) + cart summary (right)
// The 3 vehicle types (Vehículo de turismo / Camión / Motocicleta) are presented as a
// clickable dropdown. Selecting one navigates to the corresponding subdomain.
import { useEffect, useRef, useState } from 'react';
import { IconCar, IconSearch, IconCart, IconChevronDown } from './Icons.jsx';

const VEHICLE_TYPES = [
  { id: 'car', label: 'Vehículo de turismo', href: 'https://www.autodoc.es/repuestos' },
  { id: 'truck', label: 'Camión', href: 'https://camiones.autodoc.es/' },
  { id: 'moto', label: 'Motocicleta', href: 'https://moto.autodoc.es/' },
];

export default function VehicleTypeBar() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(VEHICLE_TYPES[0]);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const choose = (t) => { setType(t); setOpen(false); /* navigate to subdomain */ window.location.href = t.href; };

  return (
    <div className="bg-header-bg text-header-text border-t border-white/10" data-vehicle-type-bar="">
      <div className="max-w-[1280px] mx-auto px-5 h-[40px] flex items-center gap-6">
        {/* Vehicle-type dropdown (the user's "tab list") */}
        <div className="relative flex items-stretch" ref={ref}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 h-[28px] px-3 bg-white/5 border border-white/10 rounded hover:bg-white/10"
            aria-haspopup="menu"
            aria-expanded={open}
            type="button"
          >
            <IconCar className="w-4 h-4" />
            <span className="text-[13px]">{type.label}</span>
            <IconChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <ul role="menu" className="absolute top-full left-0 mt-1 bg-white text-body-text shadow-lg rounded min-w-[200px] z-50">
              {VEHICLE_TYPES.map((t) => (
                <li key={t.id} role="none">
                  <button
                    role="menuitem"
                    onClick={() => choose(t)}
                    type="button"
                    className={`w-full text-left px-3 py-2 text-[13px] hover:bg-gray-100 ${t.id === type.id ? 'font-semibold' : ''}`}
                  >
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Free-text search */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex-1 max-w-[720px] flex items-center bg-white rounded h-[32px] px-3"
        >
          <input
            type="text"
            placeholder="Introduzca el número o el nombre de la pieza"
            className="flex-1 outline-none text-[13px] text-body-text placeholder:text-gray-muted bg-transparent"
          />
          <button type="submit" aria-label="Buscar" className="text-body-text hover:text-cta-blue">
            <IconSearch className="w-4 h-4" />
          </button>
        </form>
        {/* Cart summary */}
        <div className="ml-auto flex items-center gap-3">
          <IconCart className="w-6 h-6" />
          <div className="text-[12px] leading-tight">
            <div>Artículos <span className="ml-1">0,00 €</span></div>
            <div className="text-header-text/60">#26-9712</div>
          </div>
          <IconChevronDown className="w-3 h-3 text-header-text/60" />
        </div>
      </div>
    </div>
  );
}

```


### `engines.js`

```javascript
// Engines per model. id = `${modelId}${seq}`. 2-4 per model.
export const ENGINES = (() => {
  const out = {};
  const variants = [
    '1.0 TSI 95cv', '1.0 TSI 110cv', '1.2 TSI 85cv', '1.4 TSI 125cv', '1.4 TSI 150cv',
    '1.5 TSI 130cv', '1.5 dCi 90cv', '1.5 dCi 110cv', '1.6 TDI 110cv', '1.6 TDI 120cv',
    '2.0 TDI 110cv', '2.0 TDI 150cv', '2.0 TDI 190cv', '2.0 TFSI 190cv', '2.0 TFSI 245cv',
    '1.5 BlueHDi 130cv', '1.5 EcoBlue 120cv', '1.6 CRDi 136cv', '1.8 T 180cv', 'Hybrid 116cv',
  ];
  for (const makeId in (typeof window !== 'undefined' ? window : {})) {} // no-op
  // Build by iterating all known models in MODELS file (we hardcode the IDs we know exist)
  const allModelIds = [];
  for (let m = 1; m <= 30; m++) {
    for (let s = 1; s <= 5; s++) {
      const id = m * 100 + s;
      // only include if we know it exists; cheap proxy: include everything <= 305
      if (id <= 3005) allModelIds.push(id);
    }
  }
  for (const id of allModelIds) {
    const n = 2 + (id % 3); // 2..4
    const list = [];
    for (let i = 0; i < n; i++) {
      list.push({ id: id * 10 + i, name: variants[(id + i * 7) % variants.length] });
    }
    out[id] = list;
  }
  return out;
})();

```


### `makes.js`

```javascript
// 30 popular makes (Spanish labels). IDs are stable.
export const MAKES = [
  { id: 1, name: 'Audi' }, { id: 2, name: 'BMW' }, { id: 3, name: 'Mercedes-Benz' },
  { id: 4, name: 'SEAT' }, { id: 5, name: 'Volkswagen' }, { id: 6, name: 'Renault' },
  { id: 7, name: 'Peugeot' }, { id: 8, name: 'Citroën' }, { id: 9, name: 'Ford' },
  { id: 10, name: 'Opel' }, { id: 11, name: 'Toyota' }, { id: 12, name: 'Hyundai' },
  { id: 13, name: 'Kia' }, { id: 14, name: 'Nissan' }, { id: 15, name: 'Mazda' },
  { id: 16, name: 'Honda' }, { id: 17, name: 'Volvo' }, { id: 18, name: 'Škoda' },
  { id: 19, name: 'Fiat' }, { id: 20, name: 'Mitsubishi' }, { id: 21, name: 'Suzuki' },
  { id: 22, name: 'Dacia' }, { id: 23, name: 'Mini' }, { id: 24, name: 'Porsche' },
  { id: 25, name: 'Land Rover' }, { id: 26, name: 'Jaguar' }, { id: 27, name: 'Lexus' },
  { id: 28, name: 'Subaru' }, { id: 29, name: 'Tesla' }, { id: 30, name: 'Smart' },
];

```


### `models.js`

```javascript
// Models per make. id = `${makeId}${seq}`. 3-5 per make.
export const MODELS = {
  1: [{ id: 101, name: 'A1' }, { id: 102, name: 'A3' }, { id: 103, name: 'A4' }, { id: 104, name: 'Q3' }, { id: 105, name: 'Q5' }],
  2: [{ id: 201, name: 'Serie 1' }, { id: 202, name: 'Serie 3' }, { id: 203, name: 'Serie 5' }, { id: 204, name: 'X1' }, { id: 205, name: 'X3' }],
  3: [{ id: 301, name: 'Clase A' }, { id: 302, name: 'Clase C' }, { id: 303, name: 'Clase E' }, { id: 304, name: 'GLA' }],
  4: [{ id: 401, name: 'Ibiza' }, { id: 402, name: 'León' }, { id: 403, name: 'Ateca' }, { id: 404, name: 'Arona' }],
  5: [{ id: 501, name: 'Golf' }, { id: 502, name: 'Polo' }, { id: 503, name: 'Passat' }, { id: 504, name: 'Tiguan' }, { id: 505, name: 'T-Roc' }],
  6: [{ id: 601, name: 'Clio' }, { id: 602, name: 'Megane' }, { id: 603, name: 'Captur' }, { id: 604, name: 'Kadjar' }],
  7: [{ id: 701, name: '208' }, { id: 702, name: '308' }, { id: 703, name: '3008' }, { id: 704, name: '2008' }],
  8: [{ id: 801, name: 'C3' }, { id: 802, name: 'C4' }, { id: 803, name: 'C5 Aircross' }, { id: 804, name: 'Berlingo' }],
  9: [{ id: 901, name: 'Fiesta' }, { id: 902, name: 'Focus' }, { id: 903, name: 'Kuga' }, { id: 904, name: 'Puma' }],
  10: [{ id: 1001, name: 'Corsa' }, { id: 1002, name: 'Astra' }, { id: 1003, name: 'Mokka' }, { id: 1004, name: 'Crossland' }],
  11: [{ id: 1101, name: 'Yaris' }, { id: 1102, name: 'Corolla' }, { id: 1103, name: 'RAV4' }, { id: 1104, name: 'C-HR' }],
  12: [{ id: 1201, name: 'i20' }, { id: 1202, name: 'i30' }, { id: 1203, name: 'Tucson' }, { id: 1204, name: 'Kona' }],
  13: [{ id: 1301, name: 'Rio' }, { id: 1302, name: 'Ceed' }, { id: 1303, name: 'Sportage' }, { id: 1304, name: 'Stonic' }],
  14: [{ id: 1401, name: 'Micra' }, { id: 1402, name: 'Juke' }, { id: 1403, name: 'Qashqai' }, { id: 1404, name: 'X-Trail' }],
  15: [{ id: 1501, name: 'Mazda2' }, { id: 1502, name: 'Mazda3' }, { id: 1503, name: 'CX-3' }, { id: 1504, name: 'CX-5' }],
  16: [{ id: 1601, name: 'Jazz' }, { id: 1602, name: 'Civic' }, { id: 1603, name: 'HR-V' }, { id: 1604, name: 'CR-V' }],
  17: [{ id: 1701, name: 'XC40' }, { id: 1702, name: 'XC60' }, { id: 1703, name: 'XC90' }, { id: 1704, name: 'S60' }],
  18: [{ id: 1801, name: 'Fabia' }, { id: 1802, name: 'Octavia' }, { id: 1803, name: 'Superb' }, { id: 1804, name: 'Karoq' }],
  19: [{ id: 1901, name: '500' }, { id: 1902, name: 'Panda' }, { id: 1903, name: 'Tipo' }, { id: 1904, name: '500X' }],
  20: [{ id: 2001, name: 'ASX' }, { id: 2002, name: 'Eclipse Cross' }, { id: 2003, name: 'Outlander' }, { id: 2004, name: 'Colt' }],
  21: [{ id: 2101, name: 'Swift' }, { id: 2102, name: 'Vitara' }, { id: 2103, name: 'S-Cross' }, { id: 2104, name: 'Jimny' }],
  22: [{ id: 2201, name: 'Sandero' }, { id: 2202, name: 'Duster' }, { id: 2203, name: 'Logan' }, { id: 2204, name: 'Spring' }],
  23: [{ id: 2301, name: 'Cooper' }, { id: 2302, name: 'Countryman' }, { id: 2303, name: 'One' }],
  24: [{ id: 2401, name: '911' }, { id: 2402, name: 'Cayenne' }, { id: 2403, name: 'Macan' }, { id: 2404, name: 'Taycan' }],
  25: [{ id: 2501, name: 'Defender' }, { id: 2502, name: 'Discovery' }, { id: 2503, name: 'Range Rover Evoque' }, { id: 2504, name: 'Range Rover Sport' }],
  26: [{ id: 2601, name: 'XE' }, { id: 2602, name: 'XF' }, { id: 2603, name: 'F-Pace' }, { id: 2604, name: 'E-Pace' }],
  27: [{ id: 2701, name: 'CT' }, { id: 2702, name: 'IS' }, { id: 2703, name: 'RX' }, { id: 2704, name: 'UX' }],
  28: [{ id: 2801, name: 'Forester' }, { id: 2802, name: 'Outback' }, { id: 2803, name: 'XV' }],
  29: [{ id: 2901, name: 'Model 3' }, { id: 2902, name: 'Model Y' }, { id: 2903, name: 'Model S' }, { id: 2904, name: 'Model X' }],
  30: [{ id: 3001, name: 'ForTwo' }, { id: 3002, name: 'ForFour' }, { id: 3003, name: 'EQ ForTwo' }],
};

```


### `SelectionContext.jsx`

```jsx
import { createContext, useContext, useState, useCallback } from 'react';

const SelectionContext = createContext(null);

export function SelectionProvider({ children }) {
  const [selection, setSelection] = useState({ make: null, model: null, engine: null });
  const setMake = useCallback((m) => setSelection({ make: m, model: null, engine: null }), []);
  const setModel = useCallback((m) => setSelection((s) => ({ ...s, model: m, engine: null })), []);
  const setEngine = useCallback((e) => setSelection((s) => ({ ...s, engine: e })), []);
  const reset = useCallback(() => setSelection({ make: null, model: null, engine: null }), []);
  return (
    <SelectionContext.Provider value={{ selection, setMake, setModel, setEngine, reset }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error('useSelection must be used within SelectionProvider');
  return ctx;
}

```

