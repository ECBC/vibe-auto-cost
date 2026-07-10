// eval_round1.mjs — Adversarial Playwright evaluator for autodoc.es clone
// Spawns Chromium, opens both original + clone in separate contexts, runs all ACs
// from /app/clone-web/team-log/test_plan.md as page.evaluate() IIFEs, captures numeric
// evidence side-by-side, then writes team-log/eval_round_1.md.
//
// Usage: NODE_PATH=/app/node_modules node /app/clone-web/eval_round1.mjs

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const ORIG_URL = 'https://www.autodoc.es/';
const CLONE_URL = 'http://127.0.0.1:5174/';
const SCREENS_DIR = '/app/clone-web/team-log/screens';
const REPORT_PATH = '/app/clone-web/team-log/eval_round_1.md';

mkdirSync(SCREENS_DIR, { recursive: true });

// -------- helpers --------
function safeJSON(s, fallback = null) {
  try { return JSON.parse(s); } catch { return fallback; }
}
function num(x) {
  if (x == null) return null;
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}
function rgbToHex(rgb) {
  if (!rgb || typeof rgb !== 'string') return rgb;
  const m = rgb.match(/\d+/g);
  if (!m || m.length < 3) return rgb;
  return '#' + m.slice(0, 3).map((n) => parseInt(n).toString(16).padStart(2, '0')).join('').toUpperCase();
}

const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);

// -------- shared extractors --------
const EXTRACTORS = {
  // AC-1 layout rectangles (header, sub-nav, selector card, banner, CTA)
  layoutRects: `(() => {
    const rectOf = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x|0, y: r.y|0, w: r.width|0, h: r.height|0 };
    };
    const textRect = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x|0, y: r.y|0, w: r.width|0, h: r.height|0 };
    };
    // header = top utility bar (PLUS / logo / mi taller)
    const header = document.querySelector('header, [class*="header"]:not([class*="sub"])');
    // dark sub-nav
    const subnav = Array.from(document.querySelectorAll('nav, ul, div')).find(el => {
      const t = (el.textContent || '').toLowerCase();
      return /camión|motocicleta/.test(t) && /neumáticos|llantas/.test(t);
    });
    // selector card
    const card = Array.from(document.querySelectorAll('div')).find(el => {
      const t = (el.textContent || '');
      return /Elija una marca/.test(t) && /Buscar modelo de coche por matrícula/.test(t);
    });
    // banner image area
    const banner = document.querySelector('img[src*="banner"], .slick-slider, [class*="banner"], [class*="carousel"]');
    // CTA Buscar (bottom of card)
    const cta = Array.from(document.querySelectorAll('button, a')).find(el => {
      const t = (el.textContent || '').trim();
      return t === 'Buscar' && el.tagName === 'BUTTON';
    });
    return JSON.stringify({
      header: header ? rectOf('header, [class*="header"]:not([class*="sub"])') : null,
      subnav: subnav ? { x: subnav.getBoundingClientRect().x|0, y: subnav.getBoundingClientRect().y|0, w: subnav.getBoundingClientRect().width|0, h: subnav.getBoundingClientRect().height|0 } : null,
      card: card ? { x: card.getBoundingClientRect().x|0, y: card.getBoundingClientRect().y|0, w: card.getBoundingClientRect().width|0, h: card.getBoundingClientRect().height|0 } : null,
      banner: banner ? { x: banner.getBoundingClientRect().x|0, y: banner.getBoundingClientRect().y|0, w: banner.getBoundingClientRect().width|0, h: banner.getBoundingClientRect().height|0, tag: banner.tagName, cls: (banner.className || '').toString().slice(0, 60) } : null,
      cta: cta ? { x: cta.getBoundingClientRect().x|0, y: cta.getBoundingClientRect().y|0, w: cta.getBoundingClientRect().width|0, h: cta.getBoundingClientRect().height|0, text: cta.textContent.trim() } : null,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      docH: document.documentElement.scrollHeight,
    }, null, 2);
  })()`,

  // AC-2 sub-nav list (the "tabs"): labels + order + active marker
  subnavList: `(() => {
    const items = Array.from(document.querySelectorAll('nav ul li, nav li, ul.header-nav li, .header-nav li, [class*="subnav"] li, [class*="SubNav"] li'));
    let subnavItems = items;
    if (items.length === 0) {
      // Fallback: find any <a> inside dark-bg nav region whose text matches known labels
      subnavItems = Array.from(document.querySelectorAll('nav a, ul a')).filter(a => /Camión|Motocicleta|Neumáticos|Llantas|Herramientas|Limpieza|Accesorios|Aceite|Filtros|Frenos/.test(a.textContent || ''));
    }
    const labels = subnavItems.map(li => {
      const a = li.querySelector('a') || li;
      return { text: (a.textContent || '').replace(/\\s+/g, ' ').trim(), active: /active|current|aria-selected="true"/i.test((li.className || '') + ' ' + (a.className || '') + ' ' + (a.getAttribute('aria-selected') || '')) };
    }).filter(o => o.text.length > 0);
    return JSON.stringify({ count: labels.length, items: labels }, null, 2);
  })()`,

  // AC-3 tabs clickable (style + listener presence)
  tabsClickable: `(() => {
    const tabs = Array.from(document.querySelectorAll('.header-nav li a, nav ul li a')).filter(a => /Camión|Motocicleta|Neumáticos|Llantas|Herramientas|Limpieza|Accesorios|Aceite|Filtros|Frenos/.test(a.textContent || ''));
    return JSON.stringify({
      count: tabs.length,
      first: tabs[0] ? { tag: tabs[0].tagName, cursor: getComputedStyle(tabs[0]).cursor, pointerEvents: getComputedStyle(tabs[0]).pointerEvents, href: tabs[0].getAttribute('href') } : null,
    }, null, 2);
  })()`,

  // AC-4 make/model/engine cascade
  cascade: `(() => {
    // Find the dropdown buttons inside the selector card
    const card = Array.from(document.querySelectorAll('div')).find(el => /Elija una marca/.test(el.textContent || '') && /Elija un modelo/.test(el.textContent || ''));
    if (!card) return JSON.stringify({ error: 'card not found' });
    // Find buttons matching label text
    const buttons = Array.from(card.querySelectorAll('button')).filter(b => /Elija (una marca|un modelo|un tipo de motor)/i.test(b.textContent || ''));
    const byLabel = {};
    for (const b of buttons) {
      const t = (b.textContent || '').trim();
      let key = 'unknown';
      if (/marca/i.test(t)) key = 'make';
      else if (/modelo/i.test(t)) key = 'model';
      else if (/motor/i.test(t)) key = 'engine';
      byLabel[key] = {
        text: t.replace(/\\s+/g, ' '),
        disabled: b.disabled || b.getAttribute('aria-disabled') === 'true',
        ariaExpanded: b.getAttribute('aria-expanded'),
      };
    }
    return JSON.stringify(byLabel, null, 2);
  })()`,

  // AC-5 + AC-6 CTA styles
  ctaStyles: `(() => {
    // Bottom full-width Buscar inside the selector card
    const card = Array.from(document.querySelectorAll('div')).find(el => /Elija una marca/.test(el.textContent || '') && /Elija un modelo/.test(el.textContent || ''));
    if (!card) return JSON.stringify({ error: 'card not found' });
    // The Buscar buttons; prefer the full-width one (last Buscar inside card)
    const ctas = Array.from(card.querySelectorAll('button')).filter(b => (b.textContent || '').trim() === 'Buscar');
    const cta = ctas[ctas.length - 1] || ctas[0];
    if (!cta) return JSON.stringify({ error: 'cta not found' });
    const s = getComputedStyle(cta);
    const r = cta.getBoundingClientRect();
    return JSON.stringify({
      text: cta.textContent.trim(),
      rect: { x: r.x|0, y: r.y|0, w: r.width|0, h: r.height|0 },
      bg: s.backgroundColor,
      bgHex: rgbToHexLocal(s.backgroundColor),
      color: s.color,
      colorHex: rgbToHexLocal(s.color),
      fontFamily: (s.fontFamily || '').replace(/"[^"]*Placeholder[^"]*",?\\s*/g, '').trim(),
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      borderRadius: s.borderRadius,
      padding: s.padding,
      boxShadow: s.boxShadow,
      opacity: s.opacity,
    }, null, 2);
    function rgbToHexLocal(rgb) {
      if (!rgb) return rgb;
      const m = rgb.match(/\\d+/g);
      if (!m || m.length < 3) return rgb;
      return '#' + m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('').toUpperCase();
    }
  })()`,

  // AC-6 color tokens (whole-page harvest)
  colorTokens: `(() => {
    function rgbToHexLocal(rgb) {
      if (!rgb) return rgb;
      const m = rgb.match(/\\d+/g);
      if (!m || m.length < 3) return rgb;
      return '#' + m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('').toUpperCase();
    }
    // sample body, header (top utility row), subnav, card, CTA, promo, badges
    const body = document.body;
    const bodyBg = rgbToHexLocal(getComputedStyle(body).backgroundColor);
    const bodyColor = rgbToHexLocal(getComputedStyle(body).color);
    const header = document.querySelector('header, [class*="header"]:not([class*="sub"])');
    const headerBg = header ? rgbToHexLocal(getComputedStyle(header).backgroundColor) : null;
    const headerColor = header ? rgbToHexLocal(getComputedStyle(header).color) : null;
    // subnav = ul.header-nav
    const subnav = document.querySelector('ul.header-nav, [class*="subnav"], [class*="SubNav"]');
    const subnavBg = subnav ? rgbToHexLocal(getComputedStyle(subnav.closest('nav') || subnav.parentElement || subnav).backgroundColor) : null;
    const subnavItem = document.querySelector('ul.header-nav li a, [class*="subnav"] li a');
    const subnavText = subnavItem ? rgbToHexLocal(getComputedStyle(subnavItem).color) : null;
    // card
    const card = Array.from(document.querySelectorAll('div')).find(el => /Elija una marca/.test(el.textContent || ''));
    const cardBg = card ? rgbToHexLocal(getComputedStyle(card).backgroundColor) : null;
    const cardBorder = card ? getComputedStyle(card).border : null;
    const cardRadius = card ? getComputedStyle(card).borderRadius : null;
    // CTA bottom
    const cta = card ? Array.from(card.querySelectorAll('button')).filter(b => b.textContent.trim() === 'Buscar').pop() : null;
    const ctaBg = cta ? rgbToHexLocal(getComputedStyle(cta).backgroundColor) : null;
    const ctaText = cta ? rgbToHexLocal(getComputedStyle(cta).color) : null;
    // Step badges
    const badge = card ? card.querySelector('[style*="border-radius: 50%"], span[style*="border-radius"], [class*="badge"], [class*="Badge"]') : null;
    const badgeBg = badge ? rgbToHexLocal(getComputedStyle(badge).backgroundColor) : null;
    const badgeText = badge ? rgbToHexLocal(getComputedStyle(badge).color) : null;
    // Orange / promo
    const orange = Array.from(document.querySelectorAll('div, section, span')).find(el => {
      const s = getComputedStyle(el);
      const bg = s.backgroundColor;
      return bg && /rgb\\(237,\\s*92,\\s*14\\)/.test(bg);
    });
    const orangeBg = orange ? rgbToHexLocal(getComputedStyle(orange).backgroundColor) : null;
    return JSON.stringify({
      bodyBg, bodyColor,
      headerBg, headerColor,
      subnavBg, subnavText,
      cardBg, cardBorder, cardRadius,
      ctaBg, ctaText,
      badgeBg, badgeText,
      orangeBg,
    }, null, 2);
  })()`,

  // AC-7 dropdown panel styles
  dropdownPanel: `(() => {
    const card = Array.from(document.querySelectorAll('div')).find(el => /Elija una marca/.test(el.textContent || ''));
    if (!card) return JSON.stringify({ error: 'card not found' });
    const panel = card.querySelector('[role="listbox"], ul[role="listbox"]');
    if (!panel) return JSON.stringify({ exists: false });
    const s = getComputedStyle(panel);
    const r = panel.getBoundingClientRect();
    return JSON.stringify({
      exists: true,
      display: s.display, visibility: s.visibility, opacity: s.opacity,
      boxShadow: s.boxShadow, borderRadius: s.borderRadius,
      bg: rgbToHexLocal(s.backgroundColor),
      rect: { x: r.x|0, y: r.y|0, w: r.width|0, h: r.height|0 },
    }, null, 2);
    function rgbToHexLocal(rgb) { const m=(rgb||'').match(/\\d+/g); if(!m)return rgb; return '#'+m.slice(0,3).map(n=>parseInt(n).toString(16).padStart(2,'0')).join('').toUpperCase(); }
  })()`,

  // AC-8 header logo + utility links
  headerAssets: `(() => {
    const logo = document.querySelector('header img[alt*="AUTODOC" i], header svg[class*="logo"], header [class*="logo"] img, header [class*="logo"]');
    const logoRect = logo ? (function(){const r = logo.getBoundingClientRect(); return { x:r.x|0, y:r.y|0, w:r.width|0, h:r.height|0 };})() : null;
    const utility = Array.from(document.querySelectorAll('header a, header button')).map(el => (el.textContent || '').replace(/\\s+/g,' ').trim()).filter(Boolean);
    return JSON.stringify({
      logoPresent: !!logo,
      logoSrc: logo && logo.tagName === 'IMG' ? logo.getAttribute('src') : null,
      logoRect,
      utilityLinksCount: utility.length,
      utilitySample: utility.slice(0, 8),
    }, null, 2);
  })()`,

  // AC-9 carousel
  carousel: `(() => {
    const carousel = document.querySelector('.slick-slider, [class*="carousel"], [class*="Carousel"]');
    if (!carousel) return JSON.stringify({ exists: false });
    const dots = Array.from(carousel.querySelectorAll('.slick-dots li, [class*="dot"]'));
    const slides = Array.from(carousel.querySelectorAll('.slick-slide:not(.slick-cloned), [class*="slide"]'));
    const activeIdx = dots.findIndex(d => /slick-active|active/i.test(d.className || ''));
    return JSON.stringify({
      exists: true,
      slideCount: slides.length,
      dotCount: dots.length,
      activeIdx,
      autoplay: carousel.getAttribute('data-timeout') || null,
      autoplaySpeed: carousel.getAttribute('data-autoplay-speed') || null,
      rect: (function(){const r = carousel.getBoundingClientRect(); return { x:r.x|0, y:r.y|0, w:r.width|0, h:r.height|0 };})(),
    }, null, 2);
  })()`,

  // AC-10 hover (we'll run before + after hover via separate script)
  hoverBase: `(() => {
    const a = document.querySelector('ul.header-nav li a, [class*="subnav"] li a');
    const cta = (function() {
      const card = Array.from(document.querySelectorAll('div')).find(el => /Elija una marca/.test(el.textContent || ''));
      if (!card) return null;
      return Array.from(card.querySelectorAll('button')).filter(b => b.textContent.trim() === 'Buscar').pop();
    })();
    function grab(el) {
      if (!el) return null;
      const s = getComputedStyle(el);
      return { color: s.color, bg: s.backgroundColor, boxShadow: s.boxShadow, borderColor: s.borderBottomColor };
    }
    return JSON.stringify({ tab: grab(a), cta: grab(cta) }, null, 2);
  })()`,

  // AC-11 orange/accent separators
  orangeAccents: `(() => {
    const oranges = Array.from(document.querySelectorAll('*'))
      .map(el => ({ el, bg: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color }))
      .filter(o => /rgb\\(237,\\s*92,\\s*14\\)/.test(o.bg) || /rgb\\(237,\\s*92,\\s*14\\)/.test(o.color));
    return JSON.stringify({ count: oranges.length, samples: oranges.slice(0, 4).map(o => ({ tag: o.el.tagName, cls: (o.el.className || '').toString().slice(0, 40), bg: o.bg, color: o.color })) }, null, 2);
  })()`,

  // AC-12 selection persistence (we'll click a make option and re-read the trigger)
  // AC-13 boundary check at end (1280/1440/1920)

  // AC-14 console errors (collected via window listeners)
  consoleErrors: `(() => {
    if (!window.__errs) {
      window.__errs = [];
      window.addEventListener('error', e => window.__errs.push({ type: 'error', msg: e.message, src: e.filename, line: e.lineno }));
      window.addEventListener('unhandledrejection', e => window.__errs.push({ type: 'rejection', msg: String(e.reason) }));
      const origErr = console.error;
      console.error = (...a) => { window.__errs.push({ type: 'console.error', msg: a.map(x => String(x)).join(' ') }); origErr.apply(console, a); };
    }
    return JSON.stringify({ count: window.__errs.length, errors: window.__errs });
  })()`,

  // AC-15 no below-fold bleed
  belowFold: `(() => {
    const vh = window.innerHeight;
    // Find hero root: biggest section/div that contains the selector card
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
};

// -------- main eval --------
async function evalPage(page, label, url) {
  log(`[${label}] navigating...`);
  let blocked = false;
  let title = '';
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  } catch (e) {
    log(`[${label}] goto error: ${e.message.slice(0, 100)}`);
  }
  // Cloudflare wait
  await page.waitForTimeout(12000);
  // dismiss cookie/overlay
  try {
    await page.evaluate(() => {
      document.querySelectorAll('.overlay, [class*="cookie"], [class*="Cookie"], #onetrust-banner-sdk, [id*="cookie"], [class*="consent"], [class*="Consent"]').forEach(n => n.remove());
    });
  } catch {}
  title = await page.title();
  const bodyText = await page.evaluate(() => document.body ? document.body.innerText.slice(0, 800) : '').catch(() => '');
  const hasJustAMoment = /just a moment/i.test(title + ' ' + bodyText);
  const hasChallenge = /challenge|cf_chl/i.test(bodyText);
  if (hasJustAMoment || hasChallenge) {
    blocked = true;
    log(`[${label}] Cloudflare block detected. Title: ${title}`);
  } else {
    log(`[${label}] title: ${title.slice(0, 80)}`);
  }
  return { page, label, url, title, blocked, bodyText };
}

async function runAllExtractors(page, label, viewportLabel) {
  const out = {};
  for (const [k, src] of Object.entries(EXTRACTORS)) {
    try {
      const r = await page.evaluate(src);
      out[k] = safeJSON(r, { _raw: r });
    } catch (e) {
      out[k] = { _error: e.message };
    }
  }
  // AC-3 hover: hover then re-capture tab + cta
  try {
    const tab = await page.$('ul.header-nav li a, [class*="subnav"] li a');
    if (tab) await tab.hover();
    await page.waitForTimeout(300);
    const ctaBtn = await page.evaluateHandle(() => {
      const card = Array.from(document.querySelectorAll('div')).find(el => /Elija una marca/.test(el.textContent || ''));
      if (!card) return null;
      return Array.from(card.querySelectorAll('button')).filter(b => b.textContent.trim() === 'Buscar').pop() || null;
    });
    if (ctaBtn && ctaBtn.asElement()) await ctaBtn.asElement().hover();
    await page.waitForTimeout(300);
    const hoverData = await page.evaluate(EXTRACTORS.hoverBase);
    out['hoverPost'] = safeJSON(hoverData, { _raw: hoverData });
  } catch (e) {
    out['hoverPost'] = { _error: e.message };
  }
  // AC-4 cascade interaction: click Make trigger, read options, click first option
  try {
    const opened = await page.evaluate(`(() => {
      const card = Array.from(document.querySelectorAll('div')).find(el => /Elija una marca/.test(el.textContent || ''));
      const makeBtn = Array.from(card.querySelectorAll('button')).find(b => /marca/i.test(b.textContent || ''));
      if (!makeBtn) return { error: 'make button not found' };
      makeBtn.click();
      return { clicked: true };
    })()`);
    await page.waitForTimeout(400);
    const makePanel = await page.evaluate(`(() => {
      const card = Array.from(document.querySelectorAll('div')).find(el => /Elija una marca/.test(el.textContent || ''));
      const panel = card.querySelector('[role="listbox"]');
      if (!panel) return { exists: false };
      const opts = Array.from(panel.querySelectorAll('[role="option"], li')).map(o => (o.textContent || '').trim()).filter(Boolean);
      return { exists: true, optionCount: opts.length, sample: opts.slice(0, 5) };
    })()`);
    // pick first option
    await page.evaluate(`(() => {
      const card = Array.from(document.querySelectorAll('div')).find(el => /Elija una marca/.test(el.textContent || ''));
      const panel = card.querySelector('[role="listbox"]');
      const opt = panel && panel.querySelector('[role="option"], li');
      if (opt) opt.click();
    })()`);
    await page.waitForTimeout(400);
    // AC-12: re-read trigger label after selection
    const persisted = await page.evaluate(`(() => {
      const card = Array.from(document.querySelectorAll('div')).find(el => /Elija una marca/.test(el.textContent || ''));
      const makeBtn = Array.from(card.querySelectorAll('button')).find(b => /marca/i.test(b.textContent || '') || /\\b[A-Z][a-z]+\\b/.test(b.textContent || ''));
      return makeBtn ? (makeBtn.textContent || '').replace(/\\s+/g, ' ').trim() : null;
    })()`);
    // Now check model enabled + populate
    const modelAfter = await page.evaluate(`(() => {
      const card = Array.from(document.querySelectorAll('div')).find(el => /Elija una marca/.test(el.textContent || ''));
      const modelBtn = Array.from(card.querySelectorAll('button')).find(b => /modelo/i.test(b.textContent || ''));
      if (!modelBtn) return { found: false };
      modelBtn.click();
      return { found: true, disabled: modelBtn.disabled, text: modelBtn.textContent.trim() };
    })()`);
    await page.waitForTimeout(400);
    const modelPanel = await page.evaluate(`(() => {
      const card = Array.from(document.querySelectorAll('div')).find(el => /Elija una marca/.test(el.textContent || ''));
      const panels = card.querySelectorAll('[role="listbox"]');
      const last = panels[panels.length - 1];
      if (!last) return { exists: false };
      const opts = Array.from(last.querySelectorAll('[role="option"], li')).map(o => (o.textContent || '').trim()).filter(Boolean);
      return { exists: true, optionCount: opts.length, sample: opts.slice(0, 5) };
    })()`);
    out['cascadeInteraction'] = { makeOpened: opened, makePanel, persistedTrigger: persisted, modelAfter, modelPanel };
  } catch (e) {
    out['cascadeInteraction'] = { _error: e.message };
  }
  // network requests to autodoc
  out._net = page.__netRequests || [];
  return out;
}

async function screenshotAll(page, label, viewport) {
  const v = viewport.w + 'x' + viewport.h;
  const fname = `${SCREENS_DIR}/eval_${label}_${v}.png`;
  try {
    await page.screenshot({ path: fname, fullPage: false });
    return fname;
  } catch (e) {
    log(`[${label}@${v}] screenshot error: ${e.message}`);
    return null;
  }
}

async function runOn(page, label, viewport) {
  await page.setViewportSize({ width: viewport.w, height: viewport.h });
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  // reset error collector
  await page.evaluate(EXTRACTORS.consoleErrors);
  // screenshots
  const shot = await screenshotAll(page, label, viewport);
  log(`[${label}@${viewport.w}x${viewport.h}] shot: ${shot}`);
  const data = await runAllExtractors(page, label, `${viewport.w}x${viewport.h}`);
  return { viewport, screenshot: shot, data };
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  locale: 'es-ES',
  viewport: { width: 1440, height: 900 },
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
});

// Track network requests per page
async function attachNet(page, bucket) {
  page.on('request', req => {
    const u = req.url();
    if (/autodoc\.es|scdn\.autodoc|cdn\.autodoc/i.test(u)) bucket.push(u);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') bucket.push({ type: 'console.error', text: msg.text() });
  });
  page.on('pageerror', err => {
    bucket.push({ type: 'pageerror', text: err.message });
  });
}

const results = { original: {}, clone: {} };

// ---------- Original ----------
const origPage = await ctx.newPage();
const origNet = [];
origPage.__netRequests = origNet;
await attachNet(origPage, origNet);
try {
  await origPage.goto(ORIG_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await origPage.waitForTimeout(13000);
  // Try to dismiss cookies/overlay
  await origPage.evaluate(() => {
    document.querySelectorAll('.overlay, [class*="cookie"], [class*="Cookie"], #onetrust-banner-sdk, [id*="cookie"], [class*="consent"], [class*="Consent"], .modal').forEach(n => { try { n.remove(); } catch{} });
  });
  await origPage.waitForTimeout(1000);
  const title = await origPage.title();
  const body = await origPage.evaluate(() => document.body.innerText.slice(0, 200));
  log('original title:', title, '| body:', body.slice(0, 80));
  const cf = /just a moment|challenge|cf_chl/i.test(title + ' ' + body);
  if (cf) {
    log('original: Cloudflare block — trying second pass');
    try {
      await origPage.goto(ORIG_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await origPage.waitForTimeout(15000);
      await origPage.evaluate(() => document.querySelectorAll('.overlay, [class*="cookie"]').forEach(n => n.remove()));
      await origPage.waitForTimeout(1500);
    } catch (e) { log('original retry error:', e.message.slice(0, 100)); }
  }
} catch (e) {
  log('original goto error:', e.message.slice(0, 100));
}
await origPage.evaluate(EXTRACTORS.consoleErrors); // initialize collector

results.original['1440x900'] = await runOn(origPage, 'orig', { w: 1440, h: 900 });
results.original['1920x1080'] = await runOn(origPage, 'orig', { w: 1920, h: 1080 });

// ---------- Clone ----------
const clonePage = await ctx.newPage();
const cloneNet = [];
clonePage.__netRequests = cloneNet;
await attachNet(clonePage, cloneNet);
try {
  await clonePage.goto(CLONE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await clonePage.waitForTimeout(3000);
} catch (e) { log('clone goto error:', e.message.slice(0, 100)); }
await clonePage.evaluate(EXTRACTORS.consoleErrors);
results.clone['1440x900'] = await runOn(clonePage, 'clone', { w: 1440, h: 900 });
results.clone['1920x1080'] = await runOn(clonePage, 'clone', { w: 1920, h: 1080 });

// AC-13: extra viewports for clone only
results.clone['1280x800'] = await runOn(clonePage, 'clone', { w: 1280, h: 800 });
// AC-13 for original
results.original['1280x800'] = await runOn(origPage, 'orig', { w: 1280, h: 800 });

await browser.close();

// ---------- Persist raw results ----------
writeFileSync('/app/clone-web/team-log/eval_raw.json', JSON.stringify(results, null, 2));
log('raw results saved to /app/clone-web/team-log/eval_raw.json');
log('done');
