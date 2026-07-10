// Round-2 self-check: verify all BLOCKER + MAJOR fixes
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
const SCREENS = '/app/clone-web/team-log/screens';
const log = (...a) => console.log('[r2]', ...a);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ locale: 'es-ES', viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const consoleErrs = [];
const requests = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(m.text()); });
page.on('pageerror', (e) => consoleErrs.push('pageerror: ' + e.message));
page.on('request', (r) => requests.push(r.url()));

// Use the user-specified port
const PORT = 5174;
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await sleep(2500);
await page.screenshot({ path: `${SCREENS}/clone_r2_1440.png`, clip: { x: 0, y: 0, width: 1440, height: 900 } });
log('shot clone_r2_1440.png');

await page.setViewportSize({ width: 1920, height: 1080 });
await sleep(2000);
await page.screenshot({ path: `${SCREENS}/clone_r2_1920.png`, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
log('shot clone_r2_1920.png');

await page.setViewportSize({ width: 1440, height: 900 });
await sleep(1500);

// === Self-checks ===
const checks = {};

// (a) CTA bg #0068D7 at first paint
const ctaCheck = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const cta = btns.find(b => /^Buscar\s*$/.test((b.textContent || '').trim()) && b.closest('.max-w-\\[520px\\]') || /^Buscar/.test((b.textContent || '').trim()));
  if (!cta) return { found: false };
  // pick the bottom full-width one (largest)
  const all = btns.filter(b => /^Buscar\s*$/.test((b.textContent || '').trim()));
  const sorted = all.sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width);
  const bottom = sorted[0];
  if (!bottom) return { found: false };
  const s = getComputedStyle(bottom);
  const r = bottom.getBoundingClientRect();
  return {
    found: true,
    text: bottom.textContent.trim(),
    rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    bg: s.backgroundColor,
    bgHex: s.backgroundColor === 'rgb(0, 104, 215)' ? '#0068D7' : s.backgroundColor,
    color: s.color,
    colorHex: s.color === 'rgb(255, 255, 255)' ? '#FFFFFF' : s.color,
    fontFamily: s.fontFamily,
    fontSize: s.fontSize,
    fontWeight: s.fontWeight,
    borderRadius: s.borderRadius,
    padding: s.padding,
    height: s.height,
    opacity: s.opacity,
  };
});
checks.cta = ctaCheck;
log('CTA:', JSON.stringify(ctaCheck));

// (b) CTA height 48px
const ctaH = ctaCheck.found ? parseFloat(ctaCheck.height) : null;
checks.ctaHeightOK = ctaH === 48 || (ctaCheck.rect && ctaCheck.rect.h === 48);
log('CTA height 48px:', checks.ctaHeightOK, '| computed:', ctaH, '| rect:', ctaCheck.rect?.h);

// (c) semantic <header> present
const headerCheck = await page.evaluate(() => {
  const h = document.querySelector('header');
  if (!h) return { found: false };
  const r = h.getBoundingClientRect();
  const logo = h.querySelector('img[alt*="AUTODOC" i]');
  return { found: true, rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, hasLogo: !!logo };
});
checks.header = headerCheck;
log('semantic <header>:', JSON.stringify(headerCheck));

// (d) banner width within ±4px of live (735)
const bannerCheck = await page.evaluate(() => {
  const b = document.querySelector('.slick-slider');
  if (!b) return { found: false };
  const r = b.getBoundingClientRect();
  const dt = b.getAttribute('data-timeout');
  return { found: true, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), dataTimeout: dt };
});
checks.banner = bannerCheck;
log('banner:', JSON.stringify(bannerCheck));
const liveBannerW = 735;
checks.bannerWidthOK = bannerCheck.w >= liveBannerW - 4 && bannerCheck.w <= liveBannerW + 4;
log('banner width within ±4px of 735:', checks.bannerWidthOK, '| clone:', bannerCheck.w);

// (e) dot count === slide count (9)
const dotCheck = await page.evaluate(() => {
  const dots = document.querySelectorAll('.slick-dots > li');
  const slides = document.querySelectorAll('.slick-slide');
  return { dotCount: dots.length, slideCount: slides.length };
});
checks.dots = dotCheck;
checks.dotsOK = dotCheck.dotCount === dotCheck.slideCount;
log('dots:', JSON.stringify(dotCheck), '| OK:', checks.dotsOK);

// (f) autoplay advances over 4s
const idx0 = await page.evaluate(() => Array.from(document.querySelectorAll('.slick-slide')).findIndex(s => s.getAttribute('aria-hidden') === 'false'));
await sleep(4000);
const idx1 = await page.evaluate(() => Array.from(document.querySelectorAll('.slick-slide')).findIndex(s => s.getAttribute('aria-hidden') === 'false'));
checks.autoplay = { before: idx0, after: idx1, advanced: idx0 !== idx1 };
log('autoplay: before', idx0, '→ after', idx1, '| advanced:', checks.autoplay.advanced);

// (g) two nav bars present + correct items
const navCheck = await page.evaluate(() => {
  // vehicle-type bar: data-vehicle-type-bar attribute
  const vt = document.querySelector('[data-vehicle-type-bar]');
  // category sub-nav: data-category-subnav attribute
  const cn = document.querySelector('[data-category-subnav]');
  // The vehicle-type bar has a button with the current selected type label
  const vtTrigger = vt ? vt.querySelector('button[aria-haspopup="menu"]') : null;
  const vtTriggerText = vtTrigger ? vtTrigger.textContent.replace(/\s+/g, ' ').trim() : null;
  // Category sub-nav items
  const cnItems = cn ? Array.from(cn.querySelectorAll('a')).map(a => a.textContent.replace(/\s+/g, ' ').trim()) : [];
  return { vehicleTypeBar: !!vt, vtTriggerText, categorySubnav: !!cn, categoryItems: cnItems };
});
checks.navs = navCheck;
log('navs:', JSON.stringify(navCheck, null, 2));
checks.navsOK = navCheck.vehicleTypeBar && navCheck.categorySubnav && navCheck.categoryItems.length === 9;
const expectedItems = ['Vehículo de turismo', 'Neumáticos', 'Llantas', 'Herramientas', 'Limpieza y Cuidado', 'Accesorios para coches', 'Aceite de motor', 'Filtros', 'Frenos'];
checks.itemsOrderOK = JSON.stringify(navCheck.categoryItems) === JSON.stringify(expectedItems);
log('items order match:', checks.itemsOrderOK);

// (h) no autodoc.es requests
const autodocReqs = requests.filter(u => /autodoc\.es|scdn\.autodoc|cdn\.autodoc/.test(u));
log('console errors:', consoleErrs.length, '| autodoc.es requests:', autodocReqs.length);

// Save self-check report
const out = { ts: new Date().toISOString(), checks, consoleErrs: consoleErrs.slice(0, 5), autodocReqs: autodocReqs.slice(0, 5), requestCount: requests.length };
await writeFile('/app/clone-web/team-log/self_check_r2.json', JSON.stringify(out, null, 2), 'utf8');
log('saved self_check_r2.json');

// Summary
log('--- SUMMARY ---');
const allOK = checks.cta?.bg === 'rgb(0, 104, 215)' && checks.ctaHeightOK && checks.header.found && checks.bannerWidthOK && checks.dotsOK && checks.autoplay.advanced && checks.navsOK && checks.itemsOrderOK && consoleErrs.length === 0 && autodocReqs.length === 0;
log('ALL OK:', allOK);

await browser.close();
