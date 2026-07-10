// Re-shoot screenshots after dismissing cookies popup
import { chromium } from 'playwright';
import path from 'node:path';
const SCREENS = '/app/clone-web/team-log/screens';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  locale: 'es-ES',
  viewport: { width: 1440, height: 900 },
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
});
const page = await ctx.newPage();
await page.goto('https://www.autodoc.es/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise(r => setTimeout(r, 12000));
// dismiss cookies
await page.evaluate(() => {
  document.querySelectorAll('[data-popup-cookies] button').forEach(b => { if (/aceptar|permitir|accept/i.test(b.textContent || '')) b.click(); });
  document.querySelectorAll('.overlay, [data-popup-cookies]').forEach(n => { try { n.remove(); } catch (e) {} });
});
await new Promise(r => setTimeout(r, 1500));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function shot(name, w, h, full = false) {
  await page.setViewportSize({ width: w, height: h });
  await sleep(2500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(500);
  if (full) await page.screenshot({ path: path.join(SCREENS, name), fullPage: true });
  else await page.screenshot({ path: path.join(SCREENS, name), clip: { x: 0, y: 0, width: w, height: h } });
  console.log('shot', name);
}
await shot('orig_1440x900_settled.png', 1440, 900, false);
await shot('orig_1440x900_full.png', 1440, 900, true);
await shot('orig_1920x1080_settled.png', 1920, 1080, false);
await shot('orig_390x844_settled.png', 390, 844, false);
// also dump the whole header+hero block as html for reference
await page.setViewportSize({ width: 1440, height: 900 });
await sleep(1500);
const html = await page.evaluate(() => {
  const root = document.querySelector('.search-car-box, [class*=search-car-box]') || document.body;
  // walk up to also include header
  const header = document.querySelector('header');
  const promo = document.querySelector('[class*=top-promo], [class*=top-info], [class*=topbar-promo]');
  return (promo ? promo.outerHTML : '') + (header ? header.outerHTML : '') + (root ? root.outerHTML : '');
});
const fs = await import('node:fs/promises');
await fs.writeFile('/app/clone-web/team-log/refs/above_fold_dom.html', html, 'utf8');
console.log('saved above_fold_dom.html', (html.length/1024).toFixed(1), 'KB');
await browser.close();
