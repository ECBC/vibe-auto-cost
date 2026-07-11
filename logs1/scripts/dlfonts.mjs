// Intercept font responses on the page (with browser cookies + Referer) and save them
import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const FONTS = '/app/clone-web/assets/fonts';
await mkdir(FONTS, { recursive: true });
const log = (...a) => console.log('[dlfonts]', ...a);

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  locale: 'es-ES',
  viewport: { width: 1440, height: 900 },
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
});
const page = await ctx.newPage();
const seen = new Set();
const captures = [];
page.on('response', async (resp) => {
  try {
    const url = resp.url();
    if (!/\.(ttf|woff2?|otf)(\?|$)/i.test(url)) return;
    if (seen.has(url)) return;
    seen.add(url);
    const buf = await resp.body();
    if (!buf || buf.length < 100) return;
    const fn = path.basename(new URL(url).pathname);
    const dest = path.join(FONTS, fn);
    await writeFile(dest, buf);
    log('captured', fn, buf.length, 'B');
    captures.push({ url, dest, size: buf.length });
  } catch (e) { /* ignore */ }
});
await page.goto('https://www.autodoc.es/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise(r => setTimeout(r, 15000));
// Try to also trigger by scrolling so any lazy fonts load
await page.evaluate(() => window.scrollTo(0, 200));
await new Promise(r => setTimeout(r, 2000));
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 1500));
// Also try fetching via context with Referer set to autodoc.es
async function tryWithReferer(url, dest) {
  try {
    const res = await ctx.request.get(url, { headers: { Referer: 'https://www.autodoc.es/', Accept: '*/*' }, timeout: 30000 });
    if (!res.ok()) { log('REF fail', res.status(), url); return false; }
    const buf = await res.body();
    await writeFile(dest, buf);
    log('REF ok', dest, buf.length, 'B');
    return true;
  } catch (e) { log('REF err', url, e.message); return false; }
}
// Try the color sprite + fonts via referer header
await tryWithReferer('https://www.autodoc.es/assets/54eb94/images/icon-sprite-color.svg', '/app/clone-web/assets/icons/icon-sprite-color.svg');
await tryWithReferer('https://www.autodoc.es/assets/54eb94/fonts/Inter-VariableFont_opsz_wght.ttf', path.join(FONTS, 'Inter-VariableFont_opsz_wght.ttf'));
await tryWithReferer('https://www.autodoc.es/assets/54eb94/fonts/Montserrat-VariableFont_wght.ttf', path.join(FONTS, 'Montserrat-VariableFont_wght.ttf'));
log('total captured:', captures.length);
await browser.close();
