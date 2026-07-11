const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://127.0.0.1:8000/', { waitUntil: 'networkidle' });

  // Select BMW
  await page.selectOption('#select-make', 'BMW');
  await page.waitForTimeout(500);

  // Select first model
  const models = await page.$$eval('#select-model option', opts => opts.filter(o => o.value).map(o => o.value));
  if (models.length > 0) {
    await page.selectOption('#select-model', models[0]);
    await page.waitForTimeout(500);
  }

  // Select first engine
  const engines = await page.$$eval('#select-engine option', opts => opts.filter(o => o.value).map(o => o.value));
  if (engines.length > 0) {
    await page.selectOption('#select-engine', engines[0]);
    await page.waitForTimeout(300);
  }

  // Click evaluate
  await page.click('#btn-evaluate');
  await page.waitForTimeout(2000);

  // Screenshot
  await page.screenshot({ path: '/workspace/auto-evaluation/app/screenshot.png', fullPage: true });
  console.log('Screenshot saved.');

  // Run evaluator snippet
  const result = await page.evaluate(() => {
    const checkResults = { passed: true, anomalies: [] };
    const selectorBox = document.querySelector('.search-form, .selector-wrapper, #car-selection-container');
    const dashboardBox = document.querySelector('#evaluation-dashboard-root');

    if (!selectorBox || !dashboardBox) {
      checkResults.passed = false;
      checkResults.anomalies.push("Missing core layout components.");
      return JSON.stringify(checkResults);
    }

    const selectorRect = selectorBox.getBoundingClientRect();
    const dashboardRect = dashboardBox.getBoundingClientRect();

    if (dashboardRect.top < selectorRect.bottom) {
      checkResults.passed = false;
      checkResults.anomalies.push("Dashboard overlapping or rendering above the selector block.");
    }

    const computedDashboardStyle = window.getComputedStyle(dashboardBox);
    const bgHex = computedDashboardStyle.backgroundColor;

    if (bgHex === 'rgb(255, 255, 255)' || bgHex === 'rgba(0, 0, 0, 0)') {
      checkResults.passed = false;
      checkResults.anomalies.push("Injected dashboard is missing explicit brand dark background tokens.");
    }

    return JSON.stringify(checkResults, null, 2);
  });

  console.log('Evaluator result:', result);

  await browser.close();
})();
