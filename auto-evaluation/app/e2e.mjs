/**
 * Vibe-Auto-Cost — E2E Dashboard Test (Playwright)
 * Run: NODE_PATH=/app/node_modules node e2e.mjs
 */

import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:8000';

async function run() {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  console.log('1. Loading page...');
  await page.goto(BASE, { waitUntil: 'networkidle' });

  // Select make
  console.log('2. Selecting make/model/engine...');
  await page.selectOption('#select-make', { index: 1 });
  await page.waitForFunction(() => !document.getElementById('select-model').disabled, { timeout: 5000 });

  await page.selectOption('#select-model', { index: 1 });
  await page.waitForFunction(() => !document.getElementById('select-engine').disabled, { timeout: 5000 });

  await page.selectOption('#select-engine', { index: 1 });
  await page.waitForFunction(() => !document.getElementById('btn-evaluate').disabled, { timeout: 5000 });

  // Click evaluate
  console.log('3. Clicking Buscar...');
  await page.click('#btn-evaluate');
  await page.waitForSelector('#dashboard-content[style*="block"]', { timeout: 10000 });

  // (a) Dashboard below selector
  console.log('4. Checking dashboard position...');
  const selectorRect = await page.locator('.selector-form').boundingBox();
  const dashboardRect = await page.locator('#evaluation-dashboard-root').boundingBox();
  if (!dashboardRect || !selectorRect) throw new Error('Could not get bounding boxes');
  if (dashboardRect.y < selectorRect.y + selectorRect.height) {
    throw new Error(`Dashboard top (${dashboardRect.y}) is NOT below selector bottom (${selectorRect.y + selectorRect.height})`);
  }
  console.log('   ✓ Dashboard renders below selector');

  // (b) Two canvas elements with nonzero size
  console.log('5. Checking canvas elements...');
  const canvases = await page.$$('canvas');
  if (canvases.length < 2) throw new Error(`Expected ≥2 canvas elements, found ${canvases.length}`);
  for (const canvas of canvases.slice(0, 2)) {
    const box = await canvas.boundingBox();
    if (!box || box.width === 0 || box.height === 0) {
      throw new Error('Canvas has zero rendered size');
    }
  }
  console.log('   ✓ 2 canvas elements with nonzero pixels');

  // (c) Brand colors in Chart.js datasets
  console.log('6. Checking brand colors...');
  const hasColors = await page.evaluate(() => {
    const charts = Object.values(Chart.instances || {});
    if (charts.length === 0) return false;
    const allColors = charts.flatMap(c =>
      c.data.datasets.flatMap(ds => [ds.backgroundColor, ds.borderColor].flat())
    );
    const colorsStr = allColors.join(' ').toLowerCase();
    return colorsStr.includes('#ffd800') && colorsStr.includes('#ff8a00');
  });
  if (!hasColors) throw new Error('Brand colors #ffd800/#ff8a00 not found in Chart.js datasets');
  console.log('   ✓ Brand colors #ffd800/#ff8a00 present');

  console.log('\n✅ All e2e checks passed!');
  await browser.close();
}

run().catch(err => {
  console.error('❌ E2E FAILED:', err.message);
  process.exit(1);
});
