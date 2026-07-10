import { chromium } from 'playwright';

const url = 'https://www.autodoc.es/';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  locale: 'es-ES',
  viewport: { width: 1440, height: 900 },
  userAgent:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
});
const page = await ctx.newPage();

const t0 = Date.now();
try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
} catch (e) {
  console.log('goto error (continuing):', e.message);
}

// Give Cloudflare turnstile time to auto-solve
await page.waitForTimeout(12000);

const title = await page.title();
const bodyText = (await page.evaluate(() => document.body ? document.body.innerText.slice(0, 400) : 'NO BODY')).replace(/\s+/g, ' ');
const hasSelector = await page.evaluate(() => {
  const t = document.body ? document.body.innerText : '';
  return {
    elijaMarca: /Elija una marca/i.test(t),
    elijaModelo: /Elija un modelo/i.test(t),
    elijaMotor: /Elija un tipo de motor/i.test(t),
    buscar: /Buscar/.test(t),
    vehiculoTurismo: /Veh[ií]culo de turismo/i.test(t),
    justAMoment: /just a moment/i.test(t),
    challenge: /challenge|cf_chl|Enable JavaScript and cookies/i.test(t),
  };
});

console.log('=== PROBE RESULT ===');
console.log('elapsed_ms:', Date.now() - t0);
console.log('title:', title);
console.log('justAMoment:', hasSelector.justAMoment, '| challenge:', hasSelector.challenge);
console.log('real selector present:', JSON.stringify(hasSelector));
console.log('body preview:', bodyText.slice(0, 300));

if (!hasSelector.justAMoment && hasSelector.elijaMarca) {
  // Dump the selector DOM region HTML for inspection
  const html = await page.evaluate(() => {
    const root = document.querySelector('.ucr-form, [class*="selector"], [class*="vehicle-search"], form') || document.body;
    return root.outerHTML.slice(0, 6000);
  });
  console.log('=== SELECTOR HTML (6k) ===');
  console.log(html);
}

await browser.close();
