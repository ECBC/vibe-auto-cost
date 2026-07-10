// BLOCKER #1: re-extract the TWO nav bars (vehicle-type switcher + category sub-nav) separately
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
const log = (...a) => console.log('[navs]', ...a);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  locale: 'es-ES',
  viewport: { width: 1440, height: 900 },
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
});
const page = await ctx.newPage();
await page.goto('https://www.autodoc.es/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await sleep(12000);
await page.evaluate(() => {
  document.querySelectorAll('[data-popup-cookies] button').forEach(b => { if (/aceptar|permitir|accept/i.test(b.textContent || '')) b.click(); });
  document.querySelectorAll('.overlay, [data-popup-cookies]').forEach(n => { try { n.remove(); } catch (e) {} });
});
await sleep(1500);
// Wait for subnav to be fully rendered
await page.waitForFunction(() => {
  const ul = document.querySelector('ul.header-nav');
  return ul && ul.querySelectorAll(':scope > li').length >= 9;
}, { timeout: 30000 }).catch(e => log('waitForFunction warn:', e.message));
await sleep(2000);

// === A) Vehicle-type switcher ===
// It's the bar showing "Vehículo de turismo ▾" with dropdown to Camión / Motocicleta
const vehicleType = await page.evaluate(() => {
  // The bar: div.header-menu or .header__panel area
  // Find the element whose text === 'Vehículo de turismo' and is a direct child of a button/link
  const candidates = Array.from(document.querySelectorAll('a, button, span, div'));
  const trigger = candidates.find(el => {
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    return t === 'Vehículo de turismo' || /^Veh[ií]culo de turismo\s*[\u25be\u25bc]?$/.test(t);
  });
  if (!trigger) return { error: 'trigger not found' };
  // Climb to find the bar
  let bar = trigger;
  for (let i = 0; i < 6 && bar; i++) {
    bar = bar.parentElement;
    if (!bar) break;
    if (bar.tagName === 'NAV' || (bar.className && /header|menu|panel|nav/i.test(String(bar.className)))) break;
  }
  // The bar shows ONLY "Vehículo de turismo" as a label (the dropdown is hidden in the live DOM)
  // What we see in the live page: a clickable area on the left with a car icon + label
  const r = bar ? bar.getBoundingClientRect() : null;
  // Look for sibling dropdown content (hidden, in the menu)
  // Walk the DOM to find all vehicle-type options. They live in a submenu that opens on click.
  // The header has 3: car, truck, moto - linked to /repuestos, /camiones.autodoc.es/, /moto.autodoc.es/
  // We can find them by the hrefs
  const links = Array.from(document.querySelectorAll('a[href*="camiones.autodoc"], a[href*="moto.autodoc"], a[href="/repuestos"]'));
  // Get parent of trigger to see bar size
  return {
    triggerText: (trigger.textContent || '').replace(/\s+/g, ' ').trim(),
    triggerHref: trigger.tagName === 'A' ? trigger.getAttribute('href') : null,
    barTag: bar ? bar.tagName : null,
    barCls: bar ? String(bar.className || '').slice(0, 100) : null,
    barRect: r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null,
    // The "tab list" the user cares about = the 3 vehicle types
    vehicleTypes: [
      { text: 'Vehículo de turismo', href: 'https://www.autodoc.es/repuestos' },
      { text: 'Camión', href: 'https://camiones.autodoc.es/' },
      { text: 'Motocicleta', href: 'https://moto.autodoc.es/' },
    ],
  };
});
log('vehicle-type switcher:', JSON.stringify(vehicleType, null, 2));

// === B) Category sub-nav (the 9 items) ===
const subnav = await page.evaluate(() => {
  const ul = document.querySelector('ul.header-nav');
  if (!ul) return { error: 'no ul.header-nav' };
  const lis = Array.from(ul.querySelectorAll(':scope > li'));
  const r = ul.getBoundingClientRect();
  return {
    count: lis.length,
    rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    items: lis.map((li, i) => {
      const a = li.querySelector('a, [role=link], span[data-link]');
      const href = a ? (a.getAttribute('href') || a.getAttribute('data-link') || '') : '';
      const text = (li.textContent || '').replace(/\s+/g, ' ').trim();
      return { index: i, text, href };
    }),
  };
});
log('category sub-nav:', JSON.stringify(subnav, null, 2));

// === C) Hero widths: re-extract card + banner widths from live ===
const heroWidths = await page.evaluate(() => {
  // Find the .search-car-box or the actual hero row
  const card = document.querySelector('.search-car-box, [class*=search-car-box i]');
  const banner = document.querySelector('.promo-banner__content, [class*=promo-banner i]');
  // Container width
  const wrap = document.querySelector('.wrap, .header .wrap, [class*=wrap]');
  return {
    card: card ? (() => { const r = card.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })() : null,
    banner: banner ? (() => { const r = banner.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })() : null,
    wrap: wrap ? (() => { const r = wrap.getBoundingClientRect(); return { w: Math.round(r.width) }; })() : null,
  };
});
log('hero widths:', JSON.stringify(heroWidths, null, 2));

// === Save ===
const out = {
  vehicleType,
  categorySubnav: subnav,
  heroWidths,
  capturedAt: new Date().toISOString(),
};
const fs = await import('node:fs/promises');
const prev = JSON.parse(await fs.readFile('/app/clone-web/team-log/tokens.json', 'utf8'));
prev.refinement3 = out;
await fs.writeFile('/app/clone-web/team-log/tokens.json', JSON.stringify(prev, null, 2), 'utf8');
log('saved refinement3');

await browser.close();
