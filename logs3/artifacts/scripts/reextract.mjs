// Refinements 1, 2, 3: re-extract authoritative subnav + missing tokens + all banner images + sprite SVGs + fonts
import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ASSETS = '/app/clone-web/assets';
const FONTS = path.join(ASSETS, 'fonts');
const ICONS = path.join(ASSETS, 'icons');
const BANNERS = path.join(ASSETS, 'banner');
const REFS = '/app/clone-web/team-log/refs';
const log = (...a) => console.log('[refine]', ...a);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

await mkdir(FONTS, { recursive: true });
await mkdir(ICONS, { recursive: true });
await mkdir(BANNERS, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  locale: 'es-ES',
  viewport: { width: 1440, height: 900 },
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
});
const page = await ctx.newPage();
await page.goto('https://www.autodoc.es/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await sleep(12000);
// dismiss cookies
await page.evaluate(() => {
  document.querySelectorAll('[data-popup-cookies] button').forEach(b => { if (/aceptar|permitir|accept/i.test(b.textContent || '')) b.click(); });
  document.querySelectorAll('.overlay, [data-popup-cookies]').forEach(n => { try { n.remove(); } catch (e) {} });
});
await sleep(1500);
// Wait for subnav to be fully rendered (≥10 li)
await page.waitForFunction(() => {
  const ul = document.querySelector('ul.header-nav');
  return ul && ul.querySelectorAll(':scope > li').length >= 10;
}, { timeout: 30000 }).catch(e => log('waitForFunction warn:', e.message));
await sleep(2000);

// === Refinement 1: authoritative sub-nav ===
const subnav = await page.evaluate(() => {
  const ul = document.querySelector('ul.header-nav');
  if (!ul) return { items: [], error: 'no ul.header-nav' };
  const lis = Array.from(ul.querySelectorAll(':scope > li'));
  return {
    count: lis.length,
    items: lis.map((li, i) => {
      const a = li.querySelector('a, [role=link], span[data-link]');
      const href = a ? (a.getAttribute('href') || a.getAttribute('data-link') || '') : '';
      const iconUse = li.querySelector('use[href*="#sprite-"]');
      const icon = iconUse ? (iconUse.getAttribute('href') || iconUse.getAttribute('xlink:href') || '').split('#')[1] : '';
      const text = (li.textContent || '').replace(/\s+/g, ' ').trim();
      return { index: i, text, href, icon, classes: li.className };
    }),
  };
});
log('subnav items:', subnav.count);

// === Refinement 2: missing precise tokens ===
const precise = await page.evaluate(() => {
  const rgbToHex = (rgb) => {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return rgb || null;
    const m = rgb.match(/\d+(\.\d+)?/g); if (!m) return rgb;
    const [r, g, b] = m.map(Number);
    const h = (n) => Math.round(n).toString(16).padStart(2, '0').toUpperCase();
    return '#' + h(r) + h(g) + h(b);
  };
  const styleOf = (el) => {
    if (!el) return null;
    const s = getComputedStyle(el);
    return {
      backgroundColor: rgbToHex(s.backgroundColor), color: rgbToHex(s.color),
      border: s.border, borderTop: s.borderTop, borderRight: s.borderRight, borderBottom: s.borderBottom, borderLeft: s.borderLeft,
      borderColor: rgbToHex(s.borderColor), borderRadius: s.borderRadius, padding: s.padding, margin: s.margin, gap: s.gap,
      boxShadow: s.boxShadow, fontFamily: (s.fontFamily || '').replace(/"[^"]*Placeholder[^"]*",?\s*/g, '').trim(), fontSize: s.fontSize, fontWeight: s.fontWeight, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, opacity: s.opacity,
    };
  };
  // Selector card
  const card = document.querySelector('.search-car-box, [class*=search-car-box] > div, .car-selector, [class*=car-selector]');
  // Step number badge: first .car-selector__dropdown-button parent's previous sibling? look for the "1" number circle
  // The badges are inside the dropdown-button via ::before? Let's try: look for elements with class containing "num" or "step"
  // Search by text node "1" inside .car-selector
  const stepNums = Array.from(document.querySelectorAll('.car-selector [class*=num i], .car-selector [class*=step i], .car-selector [class*=badge i]'))
    .slice(0, 6).map(e => ({ tag: e.tagName, cls: String(e.className || '').slice(0, 100), text: (e.textContent || '').trim().slice(0, 10), style: styleOf(e) }));
  // Dropdown trigger: .car-selector__dropdown-button
  const trigger = document.querySelector('.car-selector__dropdown-button');
  // Dropdown panel: .car-selector__dropdown-wrap (display:none by default — read computed anyway)
  const panel = document.querySelector('.car-selector__dropdown-wrap');
  // Disabled state: a step that's currently disabled - model wrap if hidden
  const modeloWrap = document.querySelector('[data-dropdown-model-wrap="model"]');
  // License plate input
  const kbaInput = document.querySelector('input[name="kba[]"], .number-search__input input, [id^=kba]');
  const euBadge = document.querySelector('.number-search__input-icon, [class*=eu-icon]');
  // number-search block
  const numberSearch = document.querySelector('.number-search');
  // car-selector wrap
  const carSelector = document.querySelector('.car-selector, [class*=car-selector]');
  // step row (the row containing "1 Elija una marca")
  const firstStepRow = document.querySelector('.car-selector__dropdown-button');
  return {
    card: styleOf(card),
    stepNums,
    trigger: styleOf(trigger),
    panel: styleOf(panel),
    modeloWrap: styleOf(modeloWrap),
    kbaInput: styleOf(kbaInput),
    euBadge: styleOf(euBadge),
    numberSearch: styleOf(numberSearch),
    carSelector: styleOf(carSelector),
    firstStepRow: styleOf(firstStepRow),
  };
});
log('precise tokens extracted');

// === Refinement 3a: detect carousel transition (slick options / classes / inline styles) ===
const carouselInfo = await page.evaluate(() => {
  // The carousel is the slider containing the construct_banner images
  // Look for a slick slider
  const sliders = document.querySelectorAll('.slick-slider, [class*=slick i]');
  const sliderInfo = Array.from(sliders).slice(0, 5).map(s => {
    const init = s.slick ? Object.keys(s.slick).slice(0, 20) : null;
    return {
      cls: String(s.className || '').slice(0, 120),
      aria: s.getAttribute('aria-label'),
      dataAttrs: Object.fromEntries(Array.from(s.attributes).filter(a => a.name.startsWith('data-')).map(a => [a.name, a.value.slice(0, 80)])),
      slickKeys: init,
      slideCount: s.querySelectorAll('.slick-slide, [class*=slick-slide]').length,
      activeIdx: s.slick ? s.slick.currentSlide : null,
      autoplay: s.slick ? s.slick.options?.autoplay : null,
      fade: s.slick ? s.slick.options?.fade : null,
    };
  });
  // All banner image URLs in DOM
  const bannerImgs = Array.from(document.querySelectorAll('img'))
    .map(i => i.src).filter(s => /construct_banner/.test(s));
  return { sliders: sliderInfo, bannerImgs: [...new Set(bannerImgs)] };
});
log('carousel sliders:', carouselInfo.sliders.length, '| banner imgs unique:', carouselInfo.bannerImgs.length);

// === Refinement 3b: download all banner images, sprite SVGs, and fonts ===
async function download(url, dest) {
  try {
    const res = await ctx.request.get(url, { timeout: 30000 });
    if (!res.ok()) { log('DL fail', res.status(), url); return false; }
    const buf = await res.body();
    const dir = path.dirname(dest);
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
    await writeFile(dest, buf);
    log('DL ok', dest, buf.length, 'B');
    return true;
  } catch (e) { log('DL err', url, e.message); return false; }
}
// All banner images (deduped)
for (const url of carouselInfo.bannerImgs) {
  const fn = path.basename(new URL(url).pathname);
  await download(url, path.join(BANNERS, fn));
}
// Sprite SVGs
await download('https://www.autodoc.es/assets/54eb94/images/icon-sprite-bw.svg', path.join(ICONS, 'icon-sprite-bw.svg'));
await download('https://www.autodoc.es/assets/54eb94/images/icon-sprite-color.svg', path.join(ICONS, 'icon-sprite-color.svg'));
// Fonts (Inter + Montserrat TTFs)
await download('https://www.autodoc.es/assets/54eb94/fonts/Inter-VariableFont_opsz_wght.ttf', path.join(FONTS, 'Inter-VariableFont_opsz_wght.ttf'));
await download('https://www.autodoc.es/assets/54eb94/fonts/Montserrat-VariableFont_wght.ttf', path.join(FONTS, 'Montserrat-VariableFont_wght.ttf'));

// Save refined tokens
const out = {
  subnav: {
    authoritative: subnav,
    capturedAt: new Date().toISOString(),
  },
  preciseTokens: precise,
  carousel: carouselInfo,
  assets: {
    banners: carouselInfo.bannerImgs.map(u => path.basename(new URL(u).pathname)),
  },
};
const prev = JSON.parse(await import('node:fs/promises').then(m => m.readFile('/app/clone-web/team-log/tokens.json', 'utf8')));
const merged = { ...prev, refinement: out, ts: new Date().toISOString() };
await writeFile('/app/clone-web/team-log/tokens.json', JSON.stringify(merged, null, 2), 'utf8');
log('tokens.json updated with refinement');

await browser.close();
log('DONE');
