// Phase 1 Discovery — autodoc.es above-the-fold header + vehicle selector
// Run: cd /app && NODE_PATH=/app/node_modules node /app/clone-web/discover.mjs
import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const TARGET = 'https://www.autodoc.es/';
const SCREENS = '/app/clone-web/team-log/screens';
const REFS = '/app/clone-web/team-log/refs';
const ASSETS = '/app/clone-web/assets';

const log = (...a) => console.log('[discover]', ...a);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function ensureDir(p) { if (!existsSync(p)) await mkdir(p, { recursive: true }); }

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  locale: 'es-ES',
  viewport: { width: 1440, height: 900 },
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
});
const page = await ctx.newPage();

// === 1. Cloudflare gate ===
let cleared = false;
let lastTitle = '';
for (let attempt = 1; attempt <= 2; attempt++) {
  try {
    await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 60000 });
  } catch (e) {
    log('goto error (continuing):', e.message);
  }
  const wait = attempt === 1 ? 12000 : 20000;
  await sleep(wait);
  lastTitle = await page.title();
  const probe = await page.evaluate(() => {
    const t = document.body ? document.body.innerText : '';
    return {
      elijaMarca: /Elija una marca/i.test(t),
      elijaModelo: /Elija un modelo/i.test(t),
      elijaMotor: /Elija un tipo de motor/i.test(t),
      buscar: /Buscar/.test(t),
      vehiculoTurismo: /Veh[ií]culo de turismo/i.test(t),
      justAMoment: /just a moment/i.test(t),
      challenge: /Enable JavaScript and cookies|cf_chl|challenge-form/i.test(t),
    };
  });
  log(`attempt ${attempt}: title="${lastTitle}" justAMoment=${probe.justAMoment} challenge=${probe.challenge} elijaMarca=${probe.elijaMarca}`);
  if (!probe.justAMoment && probe.elijaMarca) { cleared = true; break; }
}

if (!cleared) {
  log('CLOUDFLARE NOT CLEARED — last title:', lastTitle);
  await page.screenshot({ path: path.join(SCREENS, 'cloudflare_block.png'), fullPage: false });
  await browser.close();
  process.exit(2);
}
log('CLOUDFLARE CLEARED. Title:', lastTitle);

// Save clean live HTML
const liveHTML = await page.content();
await writeFile(path.join(REFS, 'autodoc_live.html'), liveHTML, 'utf8');
log('saved autodoc_live.html', (liveHTML.length / 1024).toFixed(1), 'KB');

// === 2. Screenshot matrix ===
await ensureDir(SCREENS);
async function shot(name, w, h, full = false) {
  await page.setViewportSize({ width: w, height: h });
  await sleep(2500);
  if (full) {
    await page.screenshot({ path: path.join(SCREENS, name), fullPage: true });
  } else {
    await page.screenshot({ path: path.join(SCREENS, name), clip: { x: 0, y: 0, width: w, height: h } });
  }
  log('shot', name);
}
await shot('orig_1440x900_settled.png', 1440, 900, false);
await shot('orig_1440x900_full.png', 1440, 900, true);
await shot('orig_1920x1080_settled.png', 1920, 1080, false);
await shot('orig_390x844_settled.png', 390, 844, false);
await page.setViewportSize({ width: 1440, height: 900 });
await sleep(1500);
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(500);

// === 3-4. DOM dump (header + selector) ===
const domSnippets = await page.evaluate(() => {
  let marcaNode = null;
  for (const el of document.querySelectorAll('*')) {
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (t === 'Elija una marca' || /^Elija una marca$/i.test(t)) { marcaNode = el; break; }
  }
  let sel = marcaNode;
  for (let i = 0; i < 12 && sel; i++) {
    sel = sel.parentElement;
    if (!sel) break;
    if (/FORM|SECTION/.test(sel.tagName) || (sel.className && /(selector|search|vehicle|form|ucr-)/i.test(String(sel.className)))) break;
  }
  const header = document.querySelector('header');
  return {
    headerHTML: header ? header.outerHTML : null,
    selectorHTML: sel ? sel.outerHTML : null,
    selectorTagChain: sel ? (() => { const t = []; let n = sel; while (n && t.length < 6) { t.push(n.tagName + (n.className ? '.' + String(n.className).slice(0,60) : '')); n = n.parentElement; } return t; })() : null,
  };
});
if (domSnippets.headerHTML) await writeFile(path.join(REFS, 'header_dom.html'), domSnippets.headerHTML, 'utf8');
if (domSnippets.selectorHTML) await writeFile(path.join(REFS, 'selector_dom.html'), domSnippets.selectorHTML, 'utf8');
log('selector chain:', domSnippets.selectorTagChain);

// === 5. Extract computed tokens + structure ===
const tokens = await page.evaluate(() => {
  const stripPlaceholder = (f) => (f || '').replace(/"[^"]*Placeholder[^"]*",?\s*/g, '').trim();
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
    const r = el.getBoundingClientRect();
    return {
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      color: s.color, colorHex: rgbToHex(s.color),
      backgroundColor: s.backgroundColor, backgroundColorHex: rgbToHex(s.backgroundColor),
      backgroundImage: s.backgroundImage,
      border: s.border, borderTop: s.borderTop, borderRight: s.borderRight, borderBottom: s.borderBottom, borderLeft: s.borderLeft,
      borderTopColor: rgbToHex(s.borderTopColor), borderBottomColor: rgbToHex(s.borderBottomColor), borderLeftColor: rgbToHex(s.borderLeftColor), borderRightColor: rgbToHex(s.borderRightColor),
      borderRadius: s.borderRadius, padding: s.padding, margin: s.margin, gap: s.gap,
      boxShadow: s.boxShadow, fontFamily: stripPlaceholder(s.fontFamily), fontSize: s.fontSize, fontWeight: s.fontWeight, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, textTransform: s.textTransform, opacity: s.opacity, visibility: s.visibility, display: s.display,
    };
  };
  let marcaNode = null;
  for (const el of document.querySelectorAll('*')) {
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (t === 'Elija una marca') { marcaNode = el; break; }
  }
  let selRoot = marcaNode;
  for (let i = 0; i < 14 && selRoot; i++) {
    selRoot = selRoot.parentElement;
    if (!selRoot) break;
    const tabish = selRoot.querySelectorAll('[role=tab], [class*=tab i], [class*=Tab]');
    if (tabish.length >= 2) break;
  }
  const tabElements = (() => {
    if (!selRoot) return [];
    const list = selRoot.querySelectorAll('ul > li, [role=tab], [class*=tab i]');
    const out = [];
    for (const el of list) {
      const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (t && t.length < 50) out.push({ tag: el.tagName, text: t, cls: String(el.className || '').slice(0, 100), style: styleOf(el) });
    }
    return out.slice(0, 30);
  })();
  const trigger = (needle) => {
    if (!selRoot) return null;
    const all = selRoot.querySelectorAll('input, button, [role=combobox], [class*=dropdown i], [class*=select i]');
    for (const el of all) {
      const t = (el.textContent || '').trim();
      const ph = el.getAttribute('placeholder') || '';
      const aria = el.getAttribute('aria-label') || '';
      if (needle.test(t) || needle.test(ph) || needle.test(aria)) return el;
    }
    return null;
  };
  const tMarca = trigger(/Elija una marca/i);
  const tModelo = trigger(/Elija un modelo|Elija un modelo/i);
  const tMotor = trigger(/Elija un tipo de motor/i);
  const cta = Array.from(selRoot ? selRoot.querySelectorAll('a, button') : []).find(x => /^\s*Buscar\s*$/.test((x.textContent || '').trim()) || (x.getAttribute('aria-label') || '').toLowerCase().includes('buscar'));
  const header = document.querySelector('header');
  const logoLink = header ? header.querySelector('a[href="/"], a[class*=logo i]') : null;
  const utilLinks = header ? Array.from(header.querySelectorAll('a, button')).map(a => ({ text: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60), href: a.getAttribute('href') || '' })).filter(x => x.text) : [];
  const bodyStyle = getComputedStyle(document.body);
  return {
    pageBg: rgbToHex(bodyStyle.backgroundColor),
    bodyColor: rgbToHex(bodyStyle.color),
    selectorRootTag: selRoot ? (selRoot.tagName + (selRoot.className ? '.' + String(selRoot.className).slice(0,80) : '')) : null,
    tabElements,
    dropdowns: {
      marca: styleOf(tMarca),
      modelo: styleOf(tModelo),
      motor: styleOf(tMotor),
    },
    cta: cta ? styleOf(cta) : null,
    ctaText: cta ? (cta.textContent || '').trim() : null,
    header: header ? { style: styleOf(header), logo: styleOf(logoLink) } : null,
    utilLinksSample: utilLinks.slice(0, 20),
    bodyTextSnippet: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 800),
  };
});
log('tabs found:', tokens.tabElements.length, '| cta:', tokens.ctaText);

// === 6. Colors + gradients ===
const colors = await page.evaluate(() => {
  const rgbToHex = (rgb) => {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return rgb || null;
    const m = rgb.match(/\d+(\.\d+)?/g); if (!m) return rgb;
    const [r, g, b] = m.map(Number);
    const h = (n) => Math.round(n).toString(16).padStart(2, '0').toUpperCase();
    return '#' + h(r) + h(g) + h(b);
  };
  const allEls = document.querySelectorAll('header *, [class*=selector i] *, [class*=search i] *, [class*=vehicle i] *');
  const bgSet = new Set(); const colorSet = new Set();
  for (const el of allEls) {
    const s = getComputedStyle(el);
    const bg = rgbToHex(s.backgroundColor); const c = rgbToHex(s.color);
    if (bg) bgSet.add(bg); if (c) colorSet.add(c);
  }
  const gradients = Array.from(document.querySelectorAll('header *, main *'))
    .map(e => getComputedStyle(e).backgroundImage).filter(b => b && b.includes('gradient')).slice(0, 20);
  return { backgroundColors: [...bgSet], textColors: [...colorSet], gradients };
});

// === 7. Animation/tech scan ===
const tech = await page.evaluate(() => {
  const cssAnim = []; const cssTrans = [];
  for (const el of document.querySelectorAll('*')) {
    const s = getComputedStyle(el);
    if (s.animationName && s.animationName !== 'none') cssAnim.push({ tag: el.tagName, cls: String(el.className || '').slice(0, 60), anim: s.animationName, dur: s.animationDuration, delay: s.animationDelay });
    if (s.transition && s.transition !== 'all 0s ease 0s' && s.transition !== 'none 0s ease 0s') cssTrans.push({ tag: el.tagName, cls: String(el.className || '').slice(0, 60), trans: s.transition.slice(0, 120) });
  }
  const canvases = Array.from(document.querySelectorAll('canvas')).map(c => {
    const r = c.getBoundingClientRect();
    return { w: c.width, h: c.height, aria: c.getAttribute('aria-label'), role: c.getAttribute('role'), rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } };
  });
  const videos = Array.from(document.querySelectorAll('video')).map(v => ({ src: v.src || v.querySelector('source')?.src || null, autoplay: v.autoplay, loop: v.loop, muted: v.muted }));
  const svgs = Array.from(document.querySelectorAll('svg animate, svg animateTransform, svg animateMotion')).length;
  const lottieEls = document.querySelectorAll('lottie-player, dotlottie-player, [class*="lottie"]').length;
  const iframes = Array.from(document.querySelectorAll('iframe')).map(f => ({ src: f.src?.slice(0, 200) }));
  const scriptUrls = performance.getEntriesByType('resource').filter(r => r.name.match(/\.(js|mjs)$/i)).map(r => r.name);
  const animSigs = ['gsap','three','lottie','rive','anime','framer-motion','popmotion','unicorn','spline','pixi','p5','mo.js','velocity','scroll-trigger','locomotive','barba','swiper','slick','flickity','glide','owl','tiny-slider','embla'];
  const animScripts = scriptUrls.filter(u => animSigs.some(sig => u.toLowerCase().includes(sig)));
  return {
    cssAnimCount: cssAnim.length, cssAnimSample: cssAnim.slice(0, 10),
    cssTransCount: cssTrans.length, cssTransSample: cssTrans.slice(0, 10),
    canvases, videoCount: videos.length, videoSample: videos.slice(0, 5),
    svgAnimations: svgs, lottie: lottieEls, iframeCount: iframes.length, iframeSample: iframes.slice(0, 5),
    animScripts: animScripts.slice(0, 30), totalScripts: scriptUrls.length,
    gsap: typeof window.gsap !== 'undefined',
    threeJS: typeof window.THREE !== 'undefined',
    lottieJs: typeof window.lottie !== 'undefined',
  };
});

// === 8. Assets (fonts + images) ===
const assets = await page.evaluate(() => {
  const fontFaces = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSFontFaceRule) {
          fontFaces.push({ family: rule.style.getPropertyValue('font-family'), src: rule.style.getPropertyValue('src'), weight: rule.style.getPropertyValue('font-weight'), style: rule.style.getPropertyValue('font-style') });
        }
      }
    } catch (e) { /* CORS */ }
  }
  const woff2 = performance.getEntriesByType('resource').filter(r => r.name.match(/\.woff2?(\?|$)/i)).map(r => r.name);
  const root = document.querySelector('header') || document.body;
  const imgs = Array.from(root.querySelectorAll('img')).map(i => ({ src: i.src, alt: i.alt, w: i.naturalWidth, h: i.naturalHeight }));
  const dataBgs = Array.from(root.querySelectorAll('*')).map(e => ({ cls: String(e.className || '').slice(0, 60), bg: getComputedStyle(e).backgroundImage })).filter(x => x.bg && x.bg.startsWith('url(') && x.bg.includes('data:'));
  const allImgs = Array.from(document.querySelectorAll('img')).map(i => i.src).filter(s => s);
  return { fontFaces: fontFaces.slice(0, 50), woff2: woff2.slice(0, 50), headerImgs: imgs, dataUriBgs: dataBgs, allImgUrls: allImgs.filter(u => /construct_banner|cdn\.autodoc/.test(u)).slice(0, 30) };
});

// Dismiss cookies popup overlay so hover/click are not intercepted
try {
  await page.evaluate(() => {
    document.querySelectorAll('[data-popup-cookies] .cookies-popup__btn, [data-popup-cookies] button, [data-popup-cookies] [class*=btn i], [data-popup-cookies] [class*=accept i], [data-popup-cookies] [class*=acept i]').forEach(b => b.click());
    // nuke overlay + popup from DOM as a fallback
    document.querySelectorAll('.overlay, [data-popup-cookies]').forEach(n => n.remove());
  });
  await sleep(400);
  log('cookies popup dismissed');
} catch (e) { log('cookies dismiss err:', e.message); }

// === 9. Hover states (one tab + CTA) ===
const hover = { tab: null, cta: null };
try {
  const buscar = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('a, button')).find(x => /^\s*Buscar\s*$/.test((x.textContent || '').trim()));
  });
  if (buscar && (await buscar.asElement())) {
    await buscar.asElement().hover();
    await sleep(400);
    hover.cta = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('a, button')).find(x => /^\s*Buscar\s*$/.test((x.textContent || '').trim()));
      if (!el) return null;
      const s = getComputedStyle(el);
      return { color: s.color, backgroundColor: s.backgroundColor, boxShadow: s.boxShadow };
    });
  }
  // also hover first likely tab
  const tab = await page.evaluateHandle(() => {
    const lists = document.querySelectorAll('ul');
    for (const ul of lists) {
      const lis = ul.querySelectorAll(':scope > li');
      if (lis.length >= 2) return lis[0];
    }
    return null;
  });
  if (tab && (await tab.asElement())) {
    await tab.asElement().hover();
    await sleep(400);
    hover.tab = await page.evaluate(() => {
      const lists = document.querySelectorAll('ul');
      for (const ul of lists) {
        const lis = ul.querySelectorAll(':scope > li');
        if (lis.length >= 2) { const s = getComputedStyle(lis[0]); return { color: s.color, backgroundColor: s.backgroundColor, boxShadow: s.boxShadow, borderBottomColor: s.borderBottomColor }; }
      }
      return null;
    });
  }
} catch (e) { log('hover err:', e.message); }

// === 10. Dropdown open behavior ===
const dropdownBehavior = { openAttempt: null, panelSnapshot: null, optionSample: null };
try {
  const marcaHandle = await page.evaluateHandle(() => {
    const all = document.querySelectorAll('input, button, [role=combobox], [class*=select i], [class*=dropdown i]');
    for (const el of all) {
      const ph = el.getAttribute('placeholder') || '';
      const t = (el.textContent || '').trim();
      if (/Elija una marca/i.test(ph) || /Elija una marca/i.test(t)) return el;
    }
    return null;
  });
  if (marcaHandle && (await marcaHandle.asElement())) {
    await marcaHandle.asElement().click();
    await sleep(700);
    dropdownBehavior.panelSnapshot = await page.evaluate(() => {
      const panels = document.querySelectorAll('[role=listbox], [class*=dropdown i][class*=open i], [class*=options i], [class*=menu i], ul[class*=show i]');
      for (const p of panels) {
        const s = getComputedStyle(p);
        const r = p.getBoundingClientRect();
        if (s.display !== 'none' && s.visibility !== 'hidden' && r.width > 50 && r.height > 20) {
          return { tag: p.tagName, cls: String(p.className || '').slice(0, 80), display: s.display, visibility: s.visibility, boxShadow: s.boxShadow, borderRadius: s.borderRadius, backgroundColor: s.backgroundColor, zIndex: s.zIndex, rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } };
        }
      }
      return null;
    });
    dropdownBehavior.optionSample = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('[role=option], li')) {
        const r = el.getBoundingClientRect();
        if (r.width > 50 && r.height > 5 && r.y > 0 && r.y < 900) {
          const s = getComputedStyle(el);
          out.push({ text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60), fontSize: s.fontSize, color: s.color, padding: s.padding, height: r.height });
          if (out.length >= 12) break;
        }
      }
      return out;
    });
    await page.keyboard.press('Escape');
    await sleep(400);
  } else {
    dropdownBehavior.openAttempt = 'marca trigger not found';
  }
} catch (e) { dropdownBehavior.openAttempt = 'err: ' + e.message; log('dropdown err:', e.message); }

const final = {
  url: TARGET, ts: new Date().toISOString(),
  cloudflare: { cleared: true, title: lastTitle },
  tokens, colors, tech, assets, hover, dropdownBehavior,
};
await writeFile('/app/clone-web/team-log/tokens.json', JSON.stringify(final, null, 2), 'utf8');
log('saved tokens.json');

// === Asset download ===
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
await download('https://scdn.autodoc.de/static/logo/logo-light.svg', path.join(ASSETS, 'logo', 'logo-light.svg'));
for (const url of (assets.woff2 || []).slice(0, 6)) {
  const fn = path.basename(new URL(url).pathname);
  await download(url, path.join(ASSETS, 'fonts', fn));
}
for (const url of (assets.allImgUrls || []).slice(0, 5)) {
  const fn = path.basename(new URL(url).pathname);
  await download(url, path.join(ASSETS, 'banner', fn));
}

await browser.close();
log('DONE');
