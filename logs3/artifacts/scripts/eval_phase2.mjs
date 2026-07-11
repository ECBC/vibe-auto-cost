// eval_phase2.mjs — Phase 2 Vibe-Auto-Cost adversarial evaluator
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const APP_URL = 'http://127.0.0.1:8000/';
const OUT_DIR = '/workspace/auto-evaluation/app';
const REPORT = OUT_DIR + '/eval_round_1.md';
const SCREEN_BEFORE = OUT_DIR + '/eval_before.png';
const SCREEN_AFTER = OUT_DIR + '/eval_after.png';
const RAW = OUT_DIR + '/eval_round1.raw.json';

function rgbToHex(rgb) {
  if (!rgb) return rgb;
  const m = String(rgb).match(/\d+/g);
  if (!m || m.length < 3) return rgb;
  return '#' + m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('').toUpperCase();
}

const log = (...a) => console.log('[eval]', ...a);
const t0 = Date.now();

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ locale: 'es-ES', viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const failedRequests = [];
const consoleErrors = [];
const apiCalls = [];
page.on('request', req => { const u = req.url(); if (u.includes('/api/')) apiCalls.push({ method: req.method(), url: u }); });
page.on('requestfailed', req => failedRequests.push({ url: req.url(), failure: req.failure() && req.failure().errorText }));
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', err => consoleErrors.push('pageerror: ' + err.message));

log('navigating...');
const resp = await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
const httpStatus = resp ? resp.status() : null;
await page.waitForTimeout(2500);
await page.screenshot({ path: SCREEN_BEFORE, fullPage: true });
log('pre-shot saved');

const ac1 = await (async () => {
  const r = await fetch(APP_URL + 'api/evaluate?make=' + encodeURIComponent('BMW') + '&model=' + encodeURIComponent('BMW 111') + '&engine=Petrol');
  const j = await r.json();
  const required = {
    status: 'string',
    'metadata.requested_make': 'string',
    'metadata.requested_model': 'string',
    'metadata.matched_records': 'number',
    'reliability_scores.safety_rating': 'string',
    'reliability_scores.comfort_rating': 'string',
    'reliability_scores.overall_vibe_score': 'number',
    'financial_projections.annual_fuel_cost': 'number',
    'financial_projections.annual_maintenance_cost': 'number',
    'financial_projections.total_5_year_cost': 'number',
  };
  const missing = [];
  const typeErrors = [];
  for (const [path, expect] of Object.entries(required)) {
    const seg = path.split('.');
    let v = j;
    for (const s of seg) v = v && v[s];
    if (v === undefined || v === null) { missing.push(path); continue; }
    if (expect === 'number' && typeof v !== 'number') typeErrors.push(path + ' expected number, got ' + typeof v);
    if (expect === 'string' && typeof v !== 'string') typeErrors.push(path + ' expected string, got ' + typeof v);
  }
  return { status: r.status, body: j, missing, typeErrors };
})();

const ac7 = await (async () => {
  const url = APP_URL + 'api/evaluate?make=BMW&model=' + encodeURIComponent('BMW 111') + '&engine=Petrol';
  const [r1, r2] = await Promise.all([fetch(url), fetch(url)]);
  const [t1, t2] = await Promise.all([r1.text(), r2.text()]);
  return { identical: t1 === t2, len: t1.length };
})();

const ac5 = await (async () => {
  const r = await fetch(APP_URL + 'api/evaluate?make=DoesNotExist&model=Foo&engine=Petrol');
  return { status: r.status, body: await r.json() };
})();

const ac2 = await (async () => {
  const r1 = await fetch(APP_URL + 'api/evaluate?make=');
  return {
    emptyMakeStatus: r1.status,
    emptyMakeBody: await r1.text(),
    note: 'main.py L71-78 rejects fuel<=0 OR maint<=0 OR total<=0 with 422. global_median_fuel=8.0, global_median_maint=500 make <=0 unreachable in normal flow (sampled 20 brands - all totals > 5000).',
  };
})();

const ac3 = await (async () => {
  const bj = await (await fetch(APP_URL + 'api/brands')).json();
  const brands = bj.brands.slice(0, 20);
  const samples = [];
  for (const b of brands) {
    const j = await (await fetch(APP_URL + 'api/evaluate?make=' + encodeURIComponent(b))).json();
    samples.push({ brand: b, vibe: j.reliability_scores.overall_vibe_score });
  }
  const allIn = samples.every(s => s.vibe >= 0 && s.vibe <= 100);
  return { count: samples.length, samples, min: Math.min.apply(null, samples.map(s => s.vibe)), max: Math.max.apply(null, samples.map(s => s.vibe)), allInRange: allIn };
})();

const ac4 = {
  note: 'load_data.py L273-276: if total_5_year_cost > 150000: total_5_year_cost = 150000.0; flagged = True. Pydantic Metadata has flagged: bool = False. Real-data max ~14.7k so cap never fires.',
};

const ac8 = await (async () => {
  const bj = await (await fetch(APP_URL + 'api/brands')).json();
  const mj = await (await fetch(APP_URL + 'api/models?brand=BMW')).json();
  const firstModel = mj.models && mj.models[0];
  const ej = await (await fetch(APP_URL + 'api/engines?brand=BMW&model=' + encodeURIComponent(firstModel))).json();
  return {
    brandsCount: bj.brands.length,
    brandsSample: bj.brands.slice(0, 3),
    bmwModelsCount: mj.models.length,
    bmwModelsSample: mj.models.slice(0, 3),
    firstModel,
    enginesForFirstModel: ej.engines,
  };
})();

const ac9 = await page.evaluate(() => ({
  bodyBg: getComputedStyle(document.body).backgroundColor,
  bodyColor: getComputedStyle(document.body).color,
  title: document.title,
  selectorExists: !!document.getElementById('car-selection-container'),
  dashboardExists: !!document.getElementById('evaluation-dashboard-root'),
  chartCanvases: document.querySelectorAll('canvas').length,
}));
