// eval_round2.mjs — Round 2 adversarial evaluator for autodoc.es clone
// Re-runs all round-1 ACs PLUS the round-2 specific checks:
//   - CTA color on FRESH navigation (no prior cascadeInteraction state)
//   - Autoplay runtime (capture activeIdx at t=0, wait 4000ms, recapture)
//   - <header> semantic element + logo inside it
//   - Vehicle-type bar SEPARATELY from category sub-nav (adjudicate duplication)
//   - Horizontal overflow (scrollWidth - innerWidth === 0)
//   - data-timeout attribute present
//   - Dot count === slide count
//   - Clean cascadeInteraction per viewport (re-navigate, don't chain)
//
// Usage: NODE_PATH=/app/node_modules node /app/clone-web/eval_round2.mjs

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const ORIG_URL = 'https://www.autodoc.es/';
const CLONE_URL = 'http://127.0.0.1:5174/';
const SCREENS_DIR = '/app/clone-web/team-log/screens';
mkdirSync(SCREENS_DIR, { recursive: true });

const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);

// -------- helpers --------
function safeJSON(s, fallback = null) {
  try { return JSON.parse(s); } catch { return fallback; }
}
function rgbToHex(rgb) {
  if (!rgb || typeof rgb !== 'string') return rgb;
  const m = rgb.match(/\d+/g);
  if (!m || m.length < 3) return rgb;
  return '#' + m.slice(0, 3).map((n) => parseInt(n).toString(16).padStart(2, '0')).join('').toUpperCase();
}

// -------- shared extractors --------
const EXTRACTORS = {
  // horizontal overflow (AC-13)
  overflow: `(() => {
    return JSON.stringify({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      bodyOverflow: document.body.scrollWidth - window.innerWidth,
      hasHorizontalScrollbar: document.documentElement.scrollWidth > window.innerWidth,
    });
  })()`,

  // <header> semantic element (AC-8)
  semanticHeader: `(() => {
    const headers = Array.from(document.querySelectorAll('header'));
    const logo = document.querySelector('header img[alt*="AUTODOC" i], header [class*="logo"] img, header svg[class*="logo"]');
    return JSON.stringify({
      headerCount: headers.length,
      headerRects: headers.map(h => { const r = h.getBoundingClientRect(); return { x: r.x|0, y: r.y|0, w: r.width|0, h: r.height|0 }; }),
      headerBg: headers.length ? rgbToHexLocal(getComputedStyle(headers[0]).backgroundColor) : null,
      logoInHeader: !!logo,
      logoSrc: logo && logo.tagName === 'IMG' ? logo.getAttribute('src') : null,
      logoRect: logo ? (function(){const r = logo.getBoundingClientRect(); return { x:r.x|0, y:r.y|0, w:r.width|0, h:r.height|0 };})() : null,
    }, null, 2);
    function rgbToHexLocal(rgb) { const m=(rgb||'').match(/\\d+/g); if(!m||m.length<3)return rgb; return '#'+m.slice(0,3).map(n=>parseInt(n).toString(16).padStart(2,'0')).join('').toUpperCase(); }
  })()`,

  // Vehicle-type bar (separate from category sub-nav)
  vehicleTypeBar: `(() => {
    // vehicle-type bar has "Vehículo de turismo" + the dropdown chevron + free-text search + cart
    // use data attribute or content heuristics
    const byAttr = document.querySelector('[data-vehicle-type-bar]');
    let bar = byAttr;
    if (!bar) {
      bar = Array.from(document.querySelectorAll('div, header, nav')).find(el => {
        const t = (el.textContent || '');
        return /Veh[ií]culo de turismo/.test(t) && /Introduzca el n[úu]mero/.test(t) && /Art[íi]culos/.test(t);
      });
    }
    if (!bar) return JSON.stringify({ found: false });
    // Options in the dropdown
    const dropdown = bar.querySelector('[role="menu"], ul');
    const options = dropdown ? Array.from(dropdown.querySelectorAll('[role="menuitem"], li button, li a, button, a')).map(o => (o.textContent || '').trim()).filter(Boolean) : [];
    const selected = bar.querySelector('button[aria-expanded], button')?.textContent?.trim() || null;
    return JSON.stringify({
      found: true,
      rect: (function(){const r = bar.getBoundingClientRect(); return { x:r.x|0, y:r.y|0, w:r.width|0, h:r.height|0 };})(),
      selected: selected?.replace(/\\s+/g, ' ').slice(0, 60),
      optionCount: options.length,
      options: options.slice(0, 6),
    }, null, 2);
  })()`,

  // Category sub-nav ONLY (not vehicle-type bar)
  categorySubnav: `(() => {
    const byAttr = document.querySelector('[data-category-subnav], nav[data-category-subnav], nav[aria-label*="Categor" i]');
    let subnav = byAttr;
    if (!subnav) {
      subnav = Array.from(document.querySelectorAll('nav, ul')).find(el => {
        const t = (el.textContent || '').toLowerCase();
        // exclude vehicle-type bar (which has "Vehículo de turismo" + search + cart)
        const hasSearch = /Introduzca el n[úu]mero/.test(t);
        const hasCart = /Art[íi]culos/.test(t);
        if (hasSearch || hasCart) return false;
        const labels = ['Neumáticos', 'Llantas', 'Frenos'];
        return labels.filter(l => t.includes(l.toLowerCase())).length >= 2;
      });
    }
    if (!subnav) return JSON.stringify({ found: false });
    const items = Array.from(subnav.querySelectorAll('li a, ul a, li > *')).map(a => {
      const t = (a.textContent || '').replace(/\\s+/g, ' ').trim();
      return { text: t, href: a.getAttribute && a.getAttribute('href') };
    }).filter(o => o.text.length > 0 && o.text.length < 60);
    return JSON.stringify({
      found: true,
      rect: (function(){const r = subnav.getBoundingClientRect(); return { x:r.x|0, y:r.y|0, w:r.width|0, h:r.height|0 };})(),
      count: items.length,
      items,
    }, null, 2);
  })()`,

  // Bottom CTA Buscar (THE main full-width CTA, not the plate-search mini one)
  bottomCta: `(() => {
    // Find the Buscar button that is NOT inside the plate-search mini-form
    // The plate-search has an E badge + 1234-ABC placeholder
    const allBuscar = Array.from(document.querySelectorAll('button')).filter(b => (b.textContent || '').trim() === 'Buscar');
    // The plate-search mini CTA is inside a flex row that ALSO contains an "E" badge div and an input with placeholder "1234-ABC"
    let bottomCta = null;
    for (const b of allBuscar) {
      const card = b.closest('[style*="background-color"], [style*="backgroundColor"]') || b.closest('div');
      if (!card) continue;
      // If this CTA's parent flex row contains the E badge or 1234-ABC, it's the plate-search one — skip
      const row = b.parentElement;
      if (!row) continue;
      const hasPlateBadge = !!row.querySelector('[aria-label*="España"], [aria-label*="Spain"], [aria-label*="Espa"]');
      const hasPlateInput = !!row.querySelector('input[placeholder*="1234"], input[placeholder*="ABC"]');
      if (hasPlateBadge || hasPlateInput) continue;
      bottomCta = b;
      break;
    }
    if (!bottomCta) {
      // Fallback: last Buscar button on the page
      bottomCta = allBuscar[allBuscar.length - 1];
    }
    if (!bottomCta) return JSON.stringify({ found: false });
    const s = getComputedStyle(bottomCta);
    const r = bottomCta.getBoundingClientRect();
    return JSON.stringify({
      found: true,
      text: bottomCta.textContent.trim(),
      rect: { x:r.x|0, y:r.y|0, w:r.width|0, h:r.height|0 },
      bg: s.backgroundColor,
      bgHex: rgbToHexLocal(s.backgroundColor),
      color: s.color,
      colorHex: rgbToHexLocal(s.color),
      fontFamily: (s.fontFamily || '').replace(/"[^"]*Placeholder[^"]*",?\\s*/g, '').trim(),
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      borderRadius: s.borderRadius,
      padding: s.padding,
      height: s.height,
      boxShadow: s.boxShadow,
      opacity: s.opacity,
      disabled: bottomCta.disabled,
    }, null, 2);
    function rgbToHexLocal(rgb) { const m=(rgb||'').match(/\\d+/g); if(!m||m.length<3)return rgb; return '#'+m.slice(0,3).map(n=>parseInt(n).toString(16).padStart(2,'0')).join('').toUpperCase(); }
  })()`,

  // Banner carousel
  carousel: `(() => {
    const carousel = document.querySelector('.slick-slider, [data-timeout], [aria-label*="Banner" i]');
    if (!carousel) return JSON.stringify({ found: false });
    const slides = Array.from(carousel.querySelectorAll('.slick-slide:not(.slick-cloned)'));
    const dots = Array.from(carousel.querySelectorAll('.slick-dots > li'));
    const activeDotIdx = dots.findIndex(d => /slick-active/i.test(d.className || ''));
    // per-dot geometry
    const dotRects = dots.map(d => { const r = d.getBoundingClientRect(); return { x:r.x|0, y:r.y|0, w:r.width|0, h:r.height|0 }; });
    const activeSlideIdx = Array.from(carousel.querySelectorAll('.slick-slide')).findIndex(s => /slick-slide-active/.test(s.className || ''));
    return JSON.stringify({
      found: true,
      dataTimeout: carousel.getAttribute('data-timeout'),
      dataSlick: carousel.getAttribute('data-slick'),
      slideCount: slides.length,
      dotCount: dots.length,
      activeSlideIdx,
      activeDotIdx,
      dotRects,
      rect: (function(){const r = carousel.getBoundingClientRect(); return { x:r.x|0, y:r.y|0, w:r.width|0, h:r.height|0 };})(),
    }, null, 2);
  })()`,

  // Step dropdowns (make/model/engine)
  steps: `(() => {
    const card = Array.from(document.querySelectorAll('div')).find(el => {
      const t = el.textContent || '';
      return /Elija una marca/.test(t) && /Elija un modelo/.test(t) && /Elija un tipo de motor/.test(t);
    });
    if (!card) return JSON.stringify({ found: false });
    const buttons = Array.from(card.querySelectorAll('button')).filter(b => /marca|modelo|motor/i.test(b.textContent || ''));
    const out = {};
    for (const b of buttons) {
      const t = (b.textContent || '').trim();
      let key = 'unknown';
      if (/marca/i.test(t) && !/modelo/i.test(t)) key = 'make';
      else if (/modelo/i.test(t)) key = 'model';
      else if (/motor/i.test(t)) key = 'engine';
      out[key] = {
        text: t.replace(/\\s+/g, ' '),
        disabled: b.disabled,
        ariaExpanded: b.getAttribute('aria-expanded'),
      };
    }
    return JSON.stringify(out, null, 2);
  })()`,

  // Color tokens (whole-page harvest)
  colorTokens: `(() => {
    function rgbToHexLocal(rgb) {
      if (!rgb) return rgb;
      const m = rgb.match(/\\d+/g);
      if (!m || m.length < 3) return rgb;
      return '#' + m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('').toUpperCase();
    }
    const body = document.body;
    const bodyBg = rgbToHexLocal(getComputedStyle(body).backgroundColor);
    const bodyColor = rgbToHexLocal(getComputedStyle(body).color);
    const headerEl = document.querySelector('header');
    const headerBg = headerEl ? rgbToHexLocal(getComputedStyle(headerEl).backgroundColor) : null;
    const headerColor = headerEl ? rgbToHexLocal(getComputedStyle(headerEl).color) : null;
    // subnav (dark) — CategoryNav
    const subnavEl = document.querySelector('[data-category-subnav], nav[aria-label*="Categor" i]');
    const subnavBg = subnavEl ? rgbToHexLocal(getComputedStyle(subnavEl).backgroundColor) : null;
    const subnavItem = subnavEl ? subnavEl.querySelector('li a, ul a') : null;
    const subnavText = subnavItem ? rgbToHexLocal(getComputedStyle(subnavItem).color) : null;
    // card
    const card = Array.from(document.querySelectorAll('div')).find(el => /Elija una marca/.test(el.textContent || '') && /Elija un modelo/.test(el.textContent || ''));
    const cardBg = card ? rgbToHexLocal(getComputedStyle(card).backgroundColor) : null;
    const cardRadius = card ? getComputedStyle(card).borderRadius : null;
    // bottom CTA
    const allBuscar = Array.from(document.querySelectorAll('button')).filter(b => (b.textContent || '').trim() === 'Buscar');
    let bottomCta = null;
    for (const b of allBuscar) {
      const row = b.parentElement;
      if (!row) continue;
      const hasPlateBadge = !!row.querySelector('[aria-label*="España"], [aria-label*="Spain"], [aria-label*="Espa"]');
      const hasPlateInput = !!row.querySelector('input[placeholder*="1234"], input[placeholder*="ABC"]');
      if (hasPlateBadge || hasPlateInput) continue;
      bottomCta = b;
      break;
    }
    if (!bottomCta) bottomCta = allBuscar[allBuscar.length - 1];
    const ctaBg = bottomCta ? rgbToHexLocal(getComputedStyle(bottomCta).backgroundColor) : null;
    const ctaText = bottomCta ? rgbToHexLocal(getComputedStyle(bottomCta).color) : null;
    // Step badges (numbered circles)
    const badge = document.querySelector('[style*="border-radius: 50%"], [style*="border-radius:50%"]');
    const badgeBg = badge ? rgbToHexLocal(getComputedStyle(badge).backgroundColor) : null;
    // Orange
    const orange = Array.from(document.querySelectorAll('div, section')).find(el => /rgb\\(237,\\s*92,\\s*14\\)/.test(getComputedStyle(el).backgroundColor));
    const orangeBg = orange ? rgbToHexLocal(getComputedStyle(orange).backgroundColor) : null;
    return JSON.stringify({
      bodyBg, bodyColor,
      headerBg, headerColor,
      subnavBg, subnavText,
      cardBg, cardRadius,
      ctaBg, ctaText,
      badgeBg,
      orangeBg,
    }, null, 2);
  })()`,

  // Hover states (tab + CTA)
  hoverExtract: `(() => {
    // subnav item
    const subnavItem = document.querySelector('[data-category-subnav] li a, nav[aria-label*="Categor" i] li a');
    // bottom CTA
    const allBuscar = Array.from(document.querySelectorAll('button')).filter(b => (b.textContent || '').trim() === 'Buscar');
    let bottomCta = null;
    for (const b of allBuscar) {
      const row = b.parentElement;
      if (!row) continue;
      const hasPlateBadge = !!row.querySelector('[aria-label*="Espa"]');
      const hasPlateInput = !!row.querySelector('input[placeholder*="1234"]');
      if (hasPlateBadge || hasPlateInput) continue;
      bottomCta = b;
      break;
    }
    if (!bottomCta) bottomCta = allBuscar[allBuscar.length - 1];
    function grab(el) {
      if (!el) return null;
      const s = getComputedStyle(el);
      return { color: s.color, bg: s.backgroundColor, bgHex: rgbToHexLocal(s.backgroundColor), boxShadow: s.boxShadow };
    }
    return JSON.stringify({ tab: grab(subnavItem), cta: grab(bottomCta) }, null, 2);
    function rgbToHexLocal(rgb) { const m=(rgb||'').match(/\\d+/g); if(!m)return rgb; return '#'+m.slice(0,3).map(n=>parseInt(n).toString(16).padStart(2,'0')).join('').toUpperCase(); }
  })()`,

  // Below-fold bleed
  belowFold: `(() => {
    const vh = window.innerHeight;
    const card = Array.from(document.querySelectorAll('div')).find(el => /Elija una marca/.test(el.textContent || ''));
    const root = card ? card.closest('section, main, header, div[class*="hero"], div[class*="Hero"]') || document.body : document.body;
    const rr = root.getBoundingClientRect();
    const text = (document.body.innerText || '').toLowerCase();
    const suspicious = {
      losSuperventas: /los superv[eé]ntas/.test(text),
      todasLasCategorias: /todas las categor/i.test(text),
      todoParaSuCoche: /autodoc: todo para su coche|autodoc: todo lo que su coche/i.test(text),
    };
    const bleedNodes = Array.from(root.querySelectorAll('*')).map(e => {
      const r = e.getBoundingClientRect();
      return { tag: e.tagName, cls: (e.className || '').toString().slice(0, 30), top: r.top|0, bottom: r.bottom|0, bleed: r.bottom > vh ? (r.bottom - vh) : 0 };
    }).filter(n => n.bleed > 4);
    return JSON.stringify({ viewportH: vh, rootBottom: rr.bottom|0, rootHeight: rr.height|0, docHeight: document.documentElement.scrollHeight, bleedCount: bleedNodes.length, bleedSample: bleedNodes.slice(0, 5), suspicious }, null, 2);
  })()`,

  // Console error collector init
  initErrs: `(() => {
    if (!window.__errs) {
      window.__errs = [];
      window.addEventListener('error', e => window.__errs.push({ type: 'error', msg: e.message, src: e.filename, line: e.lineno }));
      window.addEventListener('unhandledrejection', e => window.__errs.push({ type: 'rejection', msg: String(e.reason) }));
      const origErr = console.error;
      console.error = (...a) => { window.__errs.push({ type: 'console.error', msg: a.map(x => String(x)).join(' ') }); origErr.apply(console, a); };
    }
    return JSON.stringify({ count: window.__errs.length, errors: window.__errs });
  })()`,
};

// Open Make dropdown and click first option to test AC-12 persistence
const CASCADE_INTERACTION_SCRIPT = `(() => {
  // 1. Find card
  const card = Array.from(document.querySelectorAll('div')).find(el => /Elija una marca/.test(el.textContent || '') && /Elija un modelo/.test(el.textContent || ''));
  if (!card) return { error: 'card not found' };
  // 2. Click Make trigger
  const makeBtn = Array.from(card.querySelectorAll('button')).find(b => /marca/i.test(b.textContent || ''));
  if (!makeBtn) return { error: 'make button not found' };
  makeBtn.click();
  // 3. Wait briefly then check panel
  return new Promise(resolve => {
    setTimeout(() => {
      const panel = card.querySelector('[role="listbox"]');
      if (!panel) { resolve({ error: 'listbox not found after click' }); return; }
      const opts = Array.from(panel.querySelectorAll('[role="option"], li')).map(o => (o.textContent || '').trim()).filter(Boolean);
      const optCount = opts.length;
      const firstOpt = panel.querySelector('[role="option"], li');
      if (!firstOpt) { resolve({ error: 'no options in panel' }); return; }
      firstOpt.click();
      setTimeout(() => {
        // Re-read make trigger label
        const makeBtn2 = Array.from(card.querySelectorAll('button')).find(b => /marca/i.test(b.textContent || '') || /\\b[A-Z][a-z]+\\b/.test(b.textContent || ''));
        const persistedLabel = makeBtn2 ? makeBtn2.textContent.replace(/\\s+/g, ' ').trim() : null;
        // Check model enabled
        const modelBtn = Array.from(card.querySelectorAll('button')).find(b => /modelo/i.test(b.textContent || ''));
        const modelDisabled = modelBtn ? modelBtn.disabled : null;
        // Try to open model and pick first
        if (modelBtn && !modelBtn.disabled) {
          modelBtn.click();
          setTimeout(() => {
            const panels = card.querySelectorAll('[role="listbox"]');
            const modelPanel = panels[panels.length - 1];
            const modelOpts = modelPanel ? Array.from(modelPanel.querySelectorAll('[role="option"], li')).map(o => (o.textContent || '').trim()).filter(Boolean) : [];
            const modelFirst = modelPanel ? modelPanel.querySelector('[role="option"], li') : null;
            if (modelFirst) modelFirst.click();
            setTimeout(() => {
              const engineBtn = Array.from(card.querySelectorAll('button')).find(b => /motor/i.test(b.textContent || ''));
              const engineDisabled = engineBtn ? engineBtn.disabled : null;
              resolve({
                makeOpened: true,
                makeOptionCount: optCount,
                makeFirstOptionSample: opts.slice(0, 3),
                persistedLabel,
                modelEnabledAfterMake: !modelDisabled,
                modelOptionCount: modelOpts.length,
                modelFirstOptionSample: modelOpts.slice(0, 3),
                engineEnabledAfterModel: !engineDisabled,
              });
            }, 400);
          }, 400);
        } else {
          resolve({
            makeOpened: true,
            makeOptionCount: optCount,
            makeFirstOptionSample: opts.slice(0, 3),
            persistedLabel,
            modelEnabledAfterMake: !modelDisabled,
            engineEnabledAfterModel: null,
          });
        }
      }, 400);
    }, 300);
  });
})()`;

// -------- main eval --------

async function freshEvalOnClone(browser, viewport, label) {
  // fresh context per viewport to guarantee no stale state
  const ctx = await browser.newContext({
    locale: 'es-ES',
    viewport: { width: viewport.w, height: viewport.h },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
  });
  const page = await ctx.newPage();
  const net = [];
  page.on('request', req => {
    const u = req.url();
    if (/autodoc\.es|scdn\.autodoc|cdn\.autodoc/i.test(u)) net.push(u);
  });
  page.on('console', msg => { if (msg.type() === 'error') net.push({ type: 'console.error', text: msg.text() }); });
  page.on('pageerror', err => { net.push({ type: 'pageerror', text: err.message }); });

  try {
    await page.goto(CLONE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (e) { log(`[clone-${label}] goto err: ${e.message.slice(0, 80)}`); }
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  // init error collector
  await page.evaluate(EXTRACTORS.initErrs);
  // screenshot at FRESH state (before any interaction)
  const freshShot = `${SCREENS_DIR}/eval2_clone_${viewport.w}x${viewport.h}.png`;
  await page.screenshot({ path: freshShot, fullPage: false });
  log(`[clone-${label}] fresh shot: ${freshShot}`);

  const data = {};
  for (const k of ['overflow', 'semanticHeader', 'vehicleTypeBar', 'categorySubnav', 'bottomCta', 'carousel', 'steps', 'colorTokens', 'belowFold']) {
    try {
      const r = await page.evaluate(EXTRACTORS[k]);
      data[k] = safeJSON(r, { _raw: r });
    } catch (e) { data[k] = { _error: e.message }; }
  }

  // AUTOPLAY RUNTIME TEST: capture activeIdx, wait 4s, capture again
  try {
    const before = await page.evaluate(EXTRACTORS.carousel);
    await page.waitForTimeout(4000);
    const after = await page.evaluate(EXTRACTORS.carousel);
    data.autoplayTest = { before: safeJSON(before), after: safeJSON(after), delta: (safeJSON(after)?.activeSlideIdx ?? -99) - (safeJSON(before)?.activeSlideIdx ?? -99) };
  } catch (e) { data.autoplayTest = { _error: e.message }; }

  // HOVER test: hover tab, then cta
  try {
    // mouse-move via Playwright
    const tab = await page.$('[data-category-subnav] li a, nav[aria-label*="Categor" i] li a');
    if (tab) await tab.hover();
    await page.waitForTimeout(400);
    const hoverTab = safeJSON(await page.evaluate(EXTRACTORS.hoverExtract), {});
    // hover bottom CTA (find by selector)
    const ctaHandle = await page.evaluateHandle(() => {
      const allBuscar = Array.from(document.querySelectorAll('button')).filter(b => (b.textContent || '').trim() === 'Buscar');
      for (const b of allBuscar) {
        const row = b.parentElement;
        if (!row) continue;
        if (row.querySelector('[aria-label*="Espa"]')) continue;
        if (row.querySelector('input[placeholder*="1234"]')) continue;
        return b;
      }
      return allBuscar[allBuscar.length - 1];
    });
    if (ctaHandle && ctaHandle.asElement()) await ctaHandle.asElement().hover();
    await page.waitForTimeout(400);
    const hoverCta = safeJSON(await page.evaluate(EXTRACTORS.hoverExtract), {});
    data.hover = { tab: hoverTab, cta: hoverCta };
  } catch (e) { data.hover = { _error: e.message }; }

  // Cascade interaction (fresh on this context, no chained state)
  try {
    const casc = await page.evaluate(CASCADE_INTERACTION_SCRIPT);
    data.cascadeInteraction = casc;
  } catch (e) { data.cascadeInteraction = { _error: e.message }; }

  // post-interaction shot
  const postShot = `${SCREENS_DIR}/eval2_clone_${viewport.w}x${viewport.h}_post.png`;
  try { await page.screenshot({ path: postShot, fullPage: false }); } catch {}

  data._net = net;
  await ctx.close();
  return { viewport, freshShot, postShot, data };
}

async function evalOnOriginal(browser, viewport, label) {
  const ctx = await browser.newContext({
    locale: 'es-ES',
    viewport: { width: viewport.w, height: viewport.h },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
  });
  const page = await ctx.newPage();
  const net = [];
  page.on('request', req => { const u = req.url(); if (/autodoc\.es|scdn\.autodoc|cdn\.autodoc/i.test(u)) net.push(u); });
  page.on('console', msg => { if (msg.type() === 'error') net.push({ type: 'console.error', text: msg.text() }); });
  page.on('pageerror', err => { net.push({ type: 'pageerror', text: err.message }); });

  try {
    await page.goto(ORIG_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(13000);
    await page.evaluate(() => {
      document.querySelectorAll('.overlay, [class*="cookie"], [class*="Cookie"], #onetrust-banner-sdk, [id*="cookie"], [class*="consent"], [class*="Consent"], .modal, [class*="overlay" i], [class*="popup" i]').forEach(n => { try { n.remove(); } catch{} });
    });
    await page.waitForTimeout(1500);
  } catch (e) { log(`[orig-${label}] goto err: ${e.message.slice(0, 80)}`); }

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.evaluate(EXTRACTORS.initErrs);
  const shot = `${SCREENS_DIR}/eval2_orig_${viewport.w}x${viewport.h}.png`;
  await page.screenshot({ path: shot, fullPage: false });
  log(`[orig-${label}] shot: ${shot}`);

  const data = {};
  for (const k of ['overflow', 'semanticHeader', 'vehicleTypeBar', 'categorySubnav', 'bottomCta', 'carousel', 'steps', 'colorTokens', 'belowFold']) {
    try {
      const r = await page.evaluate(EXTRACTORS[k]);
      data[k] = safeJSON(r, { _raw: r });
    } catch (e) { data[k] = { _error: e.message }; }
  }

  // Autoplay runtime
  try {
    const before = await page.evaluate(EXTRACTORS.carousel);
    await page.waitForTimeout(4000);
    const after = await page.evaluate(EXTRACTORS.carousel);
    data.autoplayTest = { before: safeJSON(before), after: safeJSON(after), delta: (safeJSON(after)?.activeSlideIdx ?? -99) - (safeJSON(before)?.activeSlideIdx ?? -99) };
  } catch (e) { data.autoplayTest = { _error: e.message }; }

  data._net = net;
  await ctx.close();
  return { viewport, shot, data };
}

// -------- main --------
const browser = await chromium.launch({ headless: true });

const viewports = [
  { w: 1440, h: 900 },
  { w: 1920, h: 1080 },
  { w: 1280, h: 800 },
];

const results = { clone: {}, original: {} };
for (const v of viewports) {
  const label = `${v.w}x${v.h}`;
  log(`=== CLONE @ ${label} ===`);
  results.clone[label] = await freshEvalOnClone(browser, v, label);
  log(`=== ORIG @ ${label} ===`);
  results.original[label] = await evalOnOriginal(browser, v, label);
}

await browser.close();
writeFileSync('/app/clone-web/team-log/eval2_raw.json', JSON.stringify(results, null, 2));
log('raw saved to eval2_raw.json');
log('done');
