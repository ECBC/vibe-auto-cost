// Try downloading fonts/sprites via page navigation (with browser cookies) and extract slick options
import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const FONTS = '/app/clone-web/assets/fonts';
const ICONS = '/app/clone-web/assets/icons';
const log = (...a) => console.log('[refine2]', ...a);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

await mkdir(FONTS, { recursive: true });
await mkdir(ICONS, { recursive: true });

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

// Extract slick options by reading the slider's slick() instance and a couple of attributes
const slick = await page.evaluate(() => {
  // The hero carousel: usually has class .slick-slider or contains construct_banner images
  const sliders = Array.from(document.querySelectorAll('.slick-slider'));
  return sliders.map(s => {
    const inst = s.slick ? {
      currentSlide: s.slick.currentSlide,
      slideCount: s.slick.slideCount,
      options: s.slick.options ? {
        autoplay: s.slick.options.autoplay,
        autoplaySpeed: s.slick.options.autoplaySpeed,
        speed: s.slick.options.speed,
        fade: s.slick.options.fade,
        cssEase: s.slick.options.cssEase,
        arrows: s.slick.options.arrows,
        dots: s.slick.options.dots,
        infinite: s.slick.options.infinite,
        slidesToShow: s.slick.options.slidesToShow,
        slidesToScroll: s.slick.options.slidesToScroll,
      } : null,
    } : null;
    const r = s.getBoundingClientRect();
    return {
      cls: String(s.className || '').slice(0, 200),
      aria: s.getAttribute('aria-label'),
      dataAttrs: Object.fromEntries(Array.from(s.attributes).filter(a => a.name.startsWith('data-')).map(a => [a.name, a.value.slice(0, 200)])),
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      slideCount: s.querySelectorAll('.slick-slide').length,
      activeIdx: inst?.currentSlide,
      autoplay: inst?.options?.autoplay,
      autoplaySpeed: inst?.options?.autoplaySpeed,
      speed: inst?.options?.speed,
      fade: inst?.options?.fade,
      cssEase: inst?.options?.cssEase,
      arrows: inst?.options?.arrows,
      dots: inst?.options?.dots,
    };
  });
});
log('slick sliders:', slick.length);
slick.forEach((s, i) => log(' ', i, '|', s.cls.slice(0, 80), '| autoplay:', s.autoplay, '| speed:', s.autoplaySpeed, '| fade:', s.fade, '| cssEase:', s.cssEase, '| active:', s.activeIdx, '| rect:', JSON.stringify(s.rect)));

// Download fonts + sprites via page.goto (with browser cookies)
async function dlViaPage(url, dest) {
  try {
    const resp = await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    if (!resp || !resp.ok()) { log('DL fail', resp?.status(), url); return false; }
    const buf = await resp.body();
    const dir = path.dirname(dest);
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
    await writeFile(dest, buf);
    log('DL ok', dest, buf.length, 'B', '(', resp.headers()['content-type'] || '?', ')');
    // Return to autodoc.es
    await page.goto('https://www.autodoc.es/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(8000);
    return true;
  } catch (e) { log('DL err', url, e.message); return false; }
}
log('--- downloading fonts and sprites via page.goto ---');
await dlViaPage('https://www.autodoc.es/assets/54eb94/fonts/Inter-VariableFont_opsz_wght.ttf', path.join(FONTS, 'Inter-VariableFont_opsz_wght.ttf'));
await dlViaPage('https://www.autodoc.es/assets/54eb94/fonts/Montserrat-VariableFont_wght.ttf', path.join(FONTS, 'Montserrat-VariableFont_wght.ttf'));
await dlViaPage('https://www.autodoc.es/assets/54eb94/images/icon-sprite-bw.svg', path.join(ICONS, 'icon-sprite-bw.svg'));
await dlViaPage('https://www.autodoc.es/assets/54eb94/images/icon-sprite-color.svg', path.join(ICONS, 'icon-sprite-color.svg'));

// Save to tokens
const out = { slick, capturedAt: new Date().toISOString() };
const fs = await import('node:fs/promises');
const prev = JSON.parse(await fs.readFile('/app/clone-web/team-log/tokens.json', 'utf8'));
prev.refinement2 = out;
await fs.writeFile('/app/clone-web/team-log/tokens.json', JSON.stringify(prev, null, 2), 'utf8');
log('saved refinement2');

await browser.close();
log('DONE');
