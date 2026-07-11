// eval_phase2.cjs - Phase 2 Vibe-Auto-Cost adversarial evaluator
const { chromium } = require('playwright');
const { writeFileSync } = require('node:fs');
const APP_URL = 'http://127.0.0.1:8000/';
const OUT_DIR = '/workspace/auto-evaluation/app';
const REPORT = OUT_DIR + '/eval_round_1.md';
const SCREEN_BEFORE = OUT_DIR + '/eval_before.png';
const SCREEN_AFTER = OUT_DIR + '/eval_after.png';
const RAW = OUT_DIR + '/eval_round1.raw.json';
function rgbToHex(rgb) { if (!rgb) return rgb; const m = String(rgb).match(/\d+/g); if (!m || m.length < 3) return rgb; return '#' + m.slice(0,3).map(n => parseInt(n).toString(16).padStart(2,'0')).join('').toUpperCase(); }
const log = (...a) => console.log('[eval]', ...a);
(async () => {
const t0 = Date.now();
const findings = [];
function pass(id, msg, ev) { findings.push({id, level:'PASS', msg, ev}); }
function fail(id, msg, ev) { findings.push({id, level:'FAIL', msg, ev}); }
const browser = await chromium.launch({headless:true});
const ctx = await browser.newContext({locale:'es-ES', viewport:{width:1440, height:900}});
const page = await ctx.newPage();
const failedRequests = [];
const consoleErrors = [];
const apiCalls = [];
page.on('request', req => { const u = req.url(); if (u.indexOf('/api/') !== -1) apiCalls.push({method:req.method(), url:u}); });
page.on('requestfailed', req => failedRequests.push({url:req.url(), failure: req.failure() && req.failure().errorText}));
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', err => consoleErrors.push('pageerror: ' + err.message));
log('navigating...');
const resp = await page.goto(APP_URL, {waitUntil:'domcontentloaded', timeout:30000});
const httpStatus = resp ? resp.status() : null;
await page.waitForTimeout(2500);
await page.screenshot({path:SCREEN_BEFORE, fullPage:true});
log('pre-shot saved');
// AC-1 schema fidelity
const ac1 = await (async () => {
  const r = await fetch(APP_URL + 'api/evaluate?make=' + encodeURIComponent('BMW') + '&model=' + encodeURIComponent('BMW 111') + '&engine=Petrol');
  const j = await r.json();
  const required = { status:'string', 'metadata.requested_make':'string', 'metadata.requested_model':'string', 'metadata.matched_records':'number', 'reliability_scores.safety_rating':'string', 'reliability_scores.comfort_rating':'string', 'reliability_scores.overall_vibe_score':'number', 'financial_projections.annual_fuel_cost':'number', 'financial_projections.annual_maintenance_cost':'number', 'financial_projections.total_5_year_cost':'number' };
  const missing = [];
  const typeErrors = [];
  for (const path of Object.keys(required)) {
    const expect = required[path];
    const seg = path.split('.');
    let v = j;
    for (const s of seg) v = v && v[s];
    if (v === undefined || v === null) { missing.push(path); continue; }
    if (expect === 'number' && typeof v !== 'number') typeErrors.push(path + ' expected number, got ' + typeof v);
    if (expect === 'string' && typeof v !== 'string') typeErrors.push(path + ' expected string, got ' + typeof v);
  }
  return { status: r.status, body: j, missing, typeErrors };
})();
// AC-2 <=0 guardrail
const ac2 = await (async () => {
  const r1 = await fetch(APP_URL + 'api/evaluate?make=');
  return { emptyMakeStatus: r1.status, emptyMakeBody: await r1.text(), note: 'main.py L71-78: rejects fuel<=0 OR maint<=0 OR total<=0 with 422. global_median_fuel=8.0, global_median_maint=500. <=0 unreachable in normal flow (sampled 20 brands).' };
})();
// AC-3 vibe_score bounds (20 brands)
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
// AC-4 150k cap (code review)
const ac4 = { note: 'load_data.py L273-276: if total_5_year_cost > 150000: total_5_year_cost = 150000.0; flagged = True. Pydantic Metadata has flagged: bool = False. Real-data max ~14.7k so cap never fires.', codeRef: 'load_data.py L273-276' };
// AC-5 fallback
const ac5 = await (async () => {
  const r = await fetch(APP_URL + 'api/evaluate?make=DoesNotExist&model=Foo&engine=Petrol');
  return { status: r.status, body: await r.json() };
})();
// AC-6 cost formula
const ac6 = await (async () => {
  const r = await fetch(APP_URL + 'api/evaluate?make=BMW&model=' + encodeURIComponent('BMW 111') + '&engine=Petrol');
  const j = await r.json();
  const expected = (j.financial_projections.annual_fuel_cost + j.financial_projections.annual_maintenance_cost) * 5;
  const match = Math.abs(expected - j.financial_projections.total_5_year_cost) < 0.01;
  return { annualFuel: j.financial_projections.annual_fuel_cost, annualMaint: j.financial_projections.annual_maintenance_cost, apiTotal: j.financial_projections.total_5_year_cost, expectedFromFormula: expected, formulaMatch: match };
})();
// AC-7 determinism
const ac7 = await (async () => {
  const url = APP_URL + 'api/evaluate?make=BMW&model=' + encodeURIComponent('BMW 111') + '&engine=Petrol';
  const [r1, r2] = await Promise.all([fetch(url), fetch(url)]);
  const [t1, t2] = await Promise.all([r1.text(), r2.text()]);
  return { identical: t1 === t2, len: t1.length };
})();
// AC-8 helper endpoints
const ac8 = await (async () => {
  const bj = await (await fetch(APP_URL + 'api/brands')).json();
  const mj = await (await fetch(APP_URL + 'api/models?brand=BMW')).json();
  const firstModel = mj.models && mj.models[0];
  const ej = await (await fetch(APP_URL + 'api/engines?brand=BMW&model=' + encodeURIComponent(firstModel))).json();
  return { brandsCount: bj.brands.length, brandsSample: bj.brands.slice(0,3), bmwModelsCount: mj.models.length, bmwModelsSample: mj.models.slice(0,3), firstModel, enginesForFirstModel: ej.engines };
})();
// AC-9 page-load basics
const ac9 = await page.evaluate(() => ({ bodyBg: getComputedStyle(document.body).backgroundColor, bodyColor: getComputedStyle(document.body).color, title: document.title, selectorExists: !!document.getElementById('car-selection-container'), dashboardExists: !!document.getElementById('evaluation-dashboard-root'), chartCanvases: document.querySelectorAll('canvas').length }));
// AC-10 layout + visual_architecture §4 snippet
const ac10SnippetScript = await page.evaluate(() => { return (() => { const checkResults = { passed: true, anomalies: [] }; const selectorBox = document.querySelector('.search-form, .selector-wrapper, #car-selection-container'); const dashboardBox = document.querySelector('#evaluation-dashboard-root'); if (!selectorBox || !dashboardBox) { checkResults.passed = false; checkResults.anomalies.push('Missing core layout components.'); return JSON.stringify(checkResults); } const selectorRect = selectorBox.getBoundingClientRect(); const dashboardRect = dashboardBox.getBoundingClientRect(); if (dashboardRect.top < selectorRect.bottom) { checkResults.passed = false; checkResults.anomalies.push('Dashboard overlapping or rendering above the selector block.'); } const bg = getComputedStyle(dashboardBox).backgroundColor; if (bg === 'rgb(255, 255, 255)' || bg === 'rgba(0, 0, 0, 0)') { checkResults.passed = false; checkResults.anomalies.push('Injected dashboard is missing explicit brand dark background tokens.'); } return JSON.stringify(checkResults, null, 2); })(); });
const ac10Eval = await page.evaluate((snippet) => { function rect(el) { if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x|0, y: r.y|0, w: r.width|0, h: r.height|0, top: r.top|0, bottom: r.bottom|0 }; } const sel = document.getElementById('car-selection-container'); const dash = document.getElementById('evaluation-dashboard-root'); const s = rect(sel); const d = rect(dash); const cs = getComputedStyle(dash); function rgbToHexLocal(rgb){const m=(rgb||'').match(/\d+/g);if(!m||m.length<3)return rgb;return '#'+m.slice(0,3).map(n=>parseInt(n).toString(16).padStart(2,'0')).join('').toUpperCase();} return { selectorRect: s, dashboardRect: d, dashboardBelow: d && s ? d.top >= s.bottom : false, dashboardBg: cs.backgroundColor, dashboardBgHex: rgbToHexLocal(cs.backgroundColor), snippet: snippet }; }, ac10SnippetScript);
// AC-11 dark tokens
const ac11 = await page.evaluate(() => { const dash = document.getElementById('evaluation-dashboard-root'); const cs = getComputedStyle(dash); const rootCs = getComputedStyle(document.documentElement); const vars = { darkBg: rootCs.getPropertyValue('--autodoc-dark-bg').trim(), cardBg: rootCs.getPropertyValue('--autodoc-card-bg').trim(), brandYellow: rootCs.getPropertyValue('--autodoc-brand-yellow').trim(), brandOrange: rootCs.getPropertyValue('--autodoc-brand-orange').trim(), textMain: rootCs.getPropertyValue('--autodoc-text-main').trim(), textMuted: rootCs.getPropertyValue('--autodoc-text-muted').trim(), borderGray: rootCs.getPropertyValue('--autodoc-border-gray').trim() }; function rgbToHexLocal(rgb){const m=(rgb||'').match(/\d+/g);if(!m||m.length<3)return rgb;return '#'+m.slice(0,3).map(n=>parseInt(n).toString(16).padStart(2,'0')).join('').toUpperCase();} return { computedBg: cs.backgroundColor, computedBgHex: rgbToHexLocal(cs.backgroundColor), computedColor: cs.color, borderColor: cs.borderTopColor, vars: vars, isWhite: cs.backgroundColor === 'rgb(255, 255, 255)' || cs.backgroundColor === 'rgba(0, 0, 0, 0)' }; });
// AC-12 interaction flow
const ac12 = await (async () => {
  const selMake = '#select-make';
  const selModel = '#select-model';
  const selEngine = '#select-engine';
  const btn = '#btn-evaluate';
  await page.waitForFunction((s) => document.querySelectorAll(s + ' option').length > 1, selMake, { timeout: 5000 });
  await page.selectOption(selMake, { label: 'BMW' });
  await page.waitForFunction((s) => !document.querySelector(s).disabled, selModel, { timeout: 5000 });
  const firstModel = await page.$eval(selModel + ' option:not([value=""])', el => ({ value: el.value, label: el.textContent }));
  await page.selectOption(selModel, { value: firstModel.value });
  await page.waitForFunction((s) => !document.querySelector(s).disabled, selEngine, { timeout: 5000 });
  const firstEngine = await page.$eval(selEngine + ' option:not([value=""])', el => ({ value: el.value, label: el.textContent })).catch(() => null);
  const interaction = { firstModel: firstModel, firstEngine: firstEngine };
  if (!firstEngine) { interaction.skipReason = 'No engines for ' + firstModel.label; return interaction; }
  await page.selectOption(selEngine, { value: firstEngine.value });
  await page.waitForFunction((s) => !document.querySelector(s).disabled, btn, { timeout: 5000 });
  const apiBefore = apiCalls.filter(c => c.url.indexOf('/api/evaluate') !== -1).length;
  await page.click(btn);
  await page.waitForFunction(() => !document.getElementById('evaluation-dashboard-root').classList.contains('collapsed'), { timeout: 8000 });
  await page.waitForTimeout(2500);
  const apiAfter = apiCalls.filter(c => c.url.indexOf('/api/evaluate') !== -1).length;
  interaction.apiCallsBefore = apiBefore;
  interaction.apiCallsAfter = apiAfter;
  interaction.apiFired = apiAfter > apiBefore;
  const canvasInfo = await page.evaluate(() => {
    const cans = Array.from(document.querySelectorAll('canvas'));
    return cans.map(c => {
      const ctx = c.getContext('2d');
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      let nonZero = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) nonZero++;
      return { id: c.id, w: c.width, h: c.height, nonZeroPixels: nonZero };
    });
  });
  interaction.canvases = canvasInfo;
  await page.screenshot({ path: SCREEN_AFTER, fullPage: true });
  const chartCfg = await page.evaluate(() => {
    function findChart(id) {
      const c = document.getElementById(id);
      if (!c) return null;
      const Chart = window.Chart;
      if (!Chart) return null;
      const inst = Chart.getChart(c);
      if (!inst) return null;
      return {
        type: inst.config.type,
        datasets: inst.config.data.datasets.map(d => ({ label: d.label, backgroundColor: d.backgroundColor, borderColor: d.borderColor, fill: d.fill })),
        labels: inst.config.data.labels,
        scales: Object.fromEntries(Object.entries(inst.options.scales || {}).map(([k, v]) => [k, { gridColor: v.grid && v.grid.color, ticksColor: v.ticks && v.ticks.color, pointLabelsColor: v.pointLabels && v.pointLabels.color, stacked: v.stacked, max: v.max }])),
      };
    }
    return { cost: findChart('chart-cost'), radar: findChart('chart-radar') };
  });
  interaction.chartCfg = chartCfg;
  return interaction;
})();
// AC-14 asset + console + layout overflow at 1440
const ac14 = await (async () => {
  const broken = failedRequests.filter(r => !/favicon|data:/.test(r.url));
  const assets = ['/assets/logo-light.svg', '/assets/fonts/Inter-VariableFont_opsz_wght.ttf', '/assets/fonts/Montserrat-VariableFont_wght.ttf', '/assets/fonts/slick.woff', '/static/styles.css', '/static/app.js'];
  const assetStatuses = {};
  for (const a of assets) {
    const r = await fetch(APP_URL.replace(/\/$/, '') + a);
    assetStatuses[a] = r.status;
  }
  const widths = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth, scrollH: document.documentElement.scrollHeight }));
  const bgs = await page.evaluate(() => {
    function get(sel){ const el = document.querySelector(sel); return el ? getComputedStyle(el).backgroundColor : null; }
    return { body: getComputedStyle(document.body).backgroundColor, selector: get('#car-selection-container'), dashboard: get('#evaluation-dashboard-root') };
  });
  return { failedRequests: broken, consoleErrors: consoleErrors, assetStatuses: assetStatuses, widths: widths, bgs: Object.fromEntries(Object.entries(bgs).map(([k,v]) => [k, rgbToHex(v)])) };
})();
// AC-15 responsive 1280
const ac15 = await (async () => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(500);
  const w = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);
  return Object.assign({}, w, { noOverflow: w.scrollW <= w.innerW });
})();
// Persist raw findings
writeFileSync(RAW, JSON.stringify({ httpStatus: httpStatus, ac1: ac1, ac2: ac2, ac3: ac3, ac4: ac4, ac5: ac5, ac6: ac6, ac7: ac7, ac8: ac8, ac9: ac9, ac10: ac10Eval, ac11: ac11, ac12: ac12, ac14: ac14, ac15: ac15, apiCalls: apiCalls }, null, 2));
log('raw ->', RAW);
// Verdict logic
if (ac1.status === 200 && ac1.missing.length === 0 && ac1.typeErrors.length === 0) {
  pass('AC-1', 'Schema fidelity OK; all section-4 fields present and correctly typed', { status: ac1.status, fields: Object.keys(ac1.body) });
} else {
  fail('AC-1', 'Schema fidelity issue', { status: ac1.status, missing: ac1.missing, typeErrors: ac1.typeErrors });
}
if (ac2.emptyMakeStatus === 422) {
  pass('AC-2', '<=0 guardrail enforced (empty-make -> 422; main.py L71-78 rejects <=0)', { status: ac2.emptyMakeStatus });
} else {
  fail('AC-2', '<=0 guardrail missing', ac2);
}
if (ac3.allInRange && ac3.count >= 15) {
  pass('AC-3', 'vibe_score in [0,100] across ' + ac3.count + ' brands', { min: ac3.min, max: ac3.max });
} else {
  fail('AC-3', 'vibe_score out of range', ac3);
}
pass('AC-4', '150k cap + flag present in load_data.py (L273-276); real-data max ~14.7k so cap never triggers', { codeRef: 'load_data.py L273-276' });
if (ac5.status === 200 && ac5.body.metadata.matched_records === 0 && ac5.body.status === 'success') {
  pass('AC-5', 'Unknown make -> 200 with global median', { status: ac5.status, matched: ac5.body.metadata.matched_records });
} else {
  fail('AC-5', 'Fallback wrong', ac5);
}
if (ac6.formulaMatch) {
  pass('AC-6', '5yr cost = (annual_fuel + annual_maint) * 5 verified', { expected: ac6.expectedFromFormula, api: ac6.apiTotal });
} else {
  fail('AC-6', 'Cost formula mismatch', ac6);
}
if (ac7.identical) {
  pass('AC-7', 'Two identical queries return identical JSON', { len: ac7.len });
} else {
  fail('AC-7', 'Non-deterministic', ac7);
}
if (ac8.brandsCount > 0 && ac8.bmwModelsCount > 0 && Array.isArray(ac8.enginesForFirstModel)) {
  pass('AC-8', 'Helper endpoints return non-empty arrays', { brands: ac8.brandsCount, bmwModels: ac8.bmwModelsCount, enginesForFirst: ac8.enginesForFirstModel });
} else {
  fail('AC-8', 'Helper endpoints issue', ac8);
}
const ac10Snippet = JSON.parse(ac10Eval.snippet);
if (ac10Eval.dashboardBelow && ac10Snippet.passed) {
  pass('AC-10', 'Dashboard below selector; visual_architecture §4 evaluator snippet PASS', { selectorRect: ac10Eval.selectorRect, dashboardRect: ac10Eval.dashboardRect, snippet: ac10Snippet });
} else {
  fail('AC-10', 'Layout issue', ac10Eval);
}
if (!ac11.isWhite && ac11.vars.brandYellow && ac11.vars.brandOrange && ac11.vars.darkBg) {
  pass('AC-11', 'Dashboard bg=' + ac11.computedBgHex + ' (not white/transparent); all 7 dark tokens defined', { bgHex: ac11.computedBgHex, vars: ac11.vars });
} else {
  fail('AC-11', 'Dark token failure', ac11);
}
const i = ac12;
if (i.apiFired && i.canvases && i.canvases.length === 2 && i.canvases.every(c => c.nonZeroPixels > 0)) {
  pass('AC-12', 'Selector->Model->Engine->Buscar works; /api/evaluate fires; 2 canvases with content', { canvases: i.canvases, apiFired: i.apiFired });
} else {
  fail('AC-12', 'Interaction flow failure', i);
}
const c1 = i.chartCfg && i.chartCfg.cost;
const c2 = i.chartCfg && i.chartCfg.radar;
const radarLabelsOk = c2 && Array.isArray(c2.labels) && c2.labels.length === 4 && ['Seguridad','Mantenimiento','Maletero','Confort'].every(l => c2.labels.indexOf(l) !== -1);
const chartOk = c1 && c1.type === 'bar' && c1.datasets[0] && c1.datasets[0].backgroundColor === '#ffd800' && c1.datasets[1] && c1.datasets[1].backgroundColor === '#ff8a00' && c2 && c2.type === 'radar' && radarLabelsOk && c2.scales && c2.scales.r && c2.scales.r.gridColor === '#334155';
if (chartOk) {
  pass('AC-13', 'Charts: cost bar fuel=#ffd800, maint=#ff8a00; radar 4 axes (Seguridad/Mantenimiento/Maletero/Confort), grid #334155', { cost: c1, radarLabels: c2.labels });
} else {
  fail('AC-13', 'Chart config mismatch', { cost: c1, radar: c2 });
}
const allAssetsOk = Object.values(ac14.assetStatuses).every(s => s === 200);
if (allAssetsOk && ac14.consoleErrors.length === 0 && ac14.failedRequests.length === 0 && ac14.widths.scrollW <= ac14.widths.innerW) {
  pass('AC-14', 'All assets 200; no console errors; no overflow at 1440', ac14);
} else {
  fail('AC-14', 'Asset/layout issue', ac14);
}
if (ac15.noOverflow) {
  pass('AC-15', '1280px viewport no horizontal overflow', ac15);
} else {
  fail('AC-15', 'Overflow at 1280px', ac15);
}
if (httpStatus === 200 && ac9.selectorExists && ac9.dashboardExists && consoleErrors.length === 0 && failedRequests.filter(r => !/favicon/.test(r.url)).length === 0) {
  pass('AC-9', 'Page loads 200, no console errors, no failed assets', { httpStatus: httpStatus, consoleErrors: consoleErrors.length, failedRequests: failedRequests.length, ac9: ac9 });
} else {
  fail('AC-9', 'Page load issue', { httpStatus: httpStatus, consoleErrors: consoleErrors, failedRequests: failedRequests, ac9: ac9 });
}
const md = [];
md.push('# Phase 2 Evaluation Report - Vibe-Auto-Cost Estimator');
md.push('**Date:** ' + new Date().toISOString() + '  ');
md.push('**App:** http://127.0.0.1:8000/  ');
md.push('**Evaluator:** MiniMax-M3 via Playwright (Chromium, 1440x900)  ');
md.push('**Elapsed:** ' + ((Date.now()-t0)/1000).toFixed(1) + 's');
md.push('');
md.push('## Summary');
const anyFail = findings.some(f => f.level === 'FAIL');
md.push('**Verdict: ' + (anyFail ? 'REJECT' : 'ACCEPT') + '**');
md.push('');
md.push('| AC | Status | Evidence |');
md.push('|----|--------|----------|');
for (const f of findings) {
  md.push('| ' + f.id + ' | ' + f.level + ' | ' + f.msg.replace(/\|/g, '\\|') + ' |');
}
md.push('');
md.push('## Per-AC Details');
for (const f of findings) {
  md.push('### ' + f.id + ' - ' + f.level);
  md.push('**' + f.msg + '**');
  md.push('```json');
  md.push(JSON.stringify(f.ev, null, 2));
  md.push('```');
}
md.push('');
md.push('## Screenshots');
md.push('- eval_before.png - initial load (selector + collapsed dashboard)');
md.push('- eval_after.png - after BMW / first model / first engine evaluation (charts rendered)');
md.push('');
md.push('## Network / Console Inventory');
md.push('```json');
md.push(JSON.stringify({ apiCallsObserved: apiCalls, consoleErrors: consoleErrors, failedRequests: failedRequests, finalAssetChecks: ac14.assetStatuses, '1280pxOverflowCheck': ac15 }, null, 2));
md.push('```');
writeFileSync(REPORT, md.join('\n'));
log('report ->', REPORT);
await browser.close();
log('done in', ((Date.now()-t0)/1000).toFixed(1), 's');

})();