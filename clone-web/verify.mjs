// Verify clone: screenshot, console errors, network requests, above-fold bleed check
import { chromium } from 'playwright';
const SCREENS = '/app/clone-web/team-log/screens';
const log = (...a) => console.log('[verify]', ...a);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ locale: 'es-ES', viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
const consoleErrs = [];
const requests = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') consoleErrs.push({ type: m.type(), text: m.text() }); });
page.on('pageerror', (e) => errors.push(String(e)));
page.on('request', (r) => requests.push(r.url()));
// also inject an error counter
await page.addInitScript(() => {
  window.__errs = [];
  window.addEventListener('error', e => window.__errs.push({ type: 'error', msg: e.message, src: e.filename }));
  window.addEventListener('unhandledrejection', e => window.__errs.push({ type: 'rejection', msg: String(e.reason) }));
  const origErr = console.error;
  console.error = (...a) => { window.__errs.push({ type: 'console.error', msg: a.map(String).join(' ') }); origErr.apply(console, a); };
});

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await sleep(3000);
await page.screenshot({ path: `${SCREENS}/clone_1440x900.png`, clip: { x: 0, y: 0, width: 1440, height: 900 } });
log('shot clone_1440x900.png');

await page.setViewportSize({ width: 1920, height: 1080 });
await sleep(2000);
await page.screenshot({ path: `${SCREENS}/clone_1920x1080.png`, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
log('shot clone_1920x1080.png');

// Above-fold bleed check
await page.setViewportSize({ width: 1440, height: 900 });
await sleep(1000);
const bleed = await page.evaluate(() => {
  const vh = window.innerHeight;
  const all = Array.from(document.querySelectorAll('*'));
  const bleedNodes = all.map((e) => {
    const r = e.getBoundingClientRect();
    return { tag: e.tagName, cls: String(e.className || '').slice(0, 40), top: r.top | 0, bottom: r.bottom | 0, h: r.height | 0, bleed: r.bottom > vh ? (r.bottom - vh) : 0 };
  }).filter(n => n.bleed > 0).slice(0, 10);
  const root = document.querySelector('section, main, [class*=hero i], #root > div') || document.body;
  return { vh, bleedCount: bleedNodes.length, bleedNodes, rootRect: (() => { const r = root.getBoundingClientRect(); return { x: r.x|0, y: r.y|0, w: r.width|0, h: r.height|0 }; })() };
});
log('viewport:', bleed.vh, '| bleedCount:', bleed.bleedCount, '| rootRect:', JSON.stringify(bleed.rootRect));

// Console / network summary
const errs = await page.evaluate(() => window.__errs || []);
const autodocReqs = requests.filter(u => /autodoc\.es|scdn\.autodoc|cdn\.autodoc/.test(u));
log('console errors:', consoleErrs.length, '| pageerrors:', errors.length, '| runtime errs:', errs.length);
log('consoleErrs:', JSON.stringify(consoleErrs.slice(0, 5)));
log('errs:', JSON.stringify(errs.slice(0, 5)));
log('autodoc.es requests:', autodocReqs.length, autodocReqs.slice(0, 5));

// Test cascade: click step 1
log('--- testing cascade ---');
await sleep(500);
const openedMake = await page.evaluate(() => {
  // find step 1 button
  const btns = Array.from(document.querySelectorAll('button'));
  const step1 = btns.find(b => /Elija una marca/.test(b.textContent || ''));
  if (!step1) return 'no step1';
  step1.click();
  return 'clicked';
});
log('open make:', openedMake);
await sleep(500);
const makeListOpen = await page.evaluate(() => {
  const lb = document.querySelector('ul[role=listbox]');
  return lb ? { items: lb.querySelectorAll('li').length, first: lb.querySelector('li')?.textContent?.trim() } : 'not open';
});
log('make listbox:', JSON.stringify(makeListOpen));
// pick first make
await page.evaluate(() => {
  const lb = document.querySelector('ul[role=listbox]');
  if (lb) lb.querySelector('li')?.click();
});
await sleep(500);
const step2 = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const s2 = btns.find(b => /Elija un modelo/.test(b.textContent || ''));
  if (!s2) return { found: false };
  return { found: true, disabled: s2.disabled, text: s2.textContent?.trim() };
});
log('step2:', JSON.stringify(step2));

// Test carousel auto-advance: read active slide at t=0, wait 3.5s, read again
const before = await page.evaluate(() => {
  const slides = Array.from(document.querySelectorAll('.slick-slide'));
  return slides.findIndex(s => s.getAttribute('aria-hidden') === 'false');
});
log('carousel active before wait:', before);
await sleep(3500);
const after = await page.evaluate(() => {
  const slides = Array.from(document.querySelectorAll('.slick-slide'));
  return slides.findIndex(s => s.getAttribute('aria-hidden') === 'false');
});
log('carousel active after 3.5s wait:', after, '| changed:', before !== after);

await browser.close();
log('DONE');
