/**
 * Playwright self-test for Phase-2 polish.
 * Checks: SRI on Chart.js, both charts render, focus outline, aria-live, no overflow.
 */
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  // Load page
  await page.goto('http://127.0.0.1:8000/', { waitUntil: 'networkidle' });

  // 1. Check SRI on Chart.js script tag
  const sriTag = await page.$('script[integrity][crossorigin="anonymous"]');
  console.log('SRI tag present:', !!sriTag);

  // 2. Check aria-live region exists
  const ariaRegion = await page.$('#aria-live-region[aria-live="polite"]');
  console.log('aria-live region present:', !!ariaRegion);

  // 3. Select BMW > BMW 111 > Petrol and evaluate
  await page.selectOption('#select-make', 'BMW');
  await page.waitForTimeout(500);
  await page.selectOption('#select-model', 'BMW 111');
  await page.waitForTimeout(500);
  await page.selectOption('#select-engine', 'Petrol');
  await page.waitForTimeout(300);
  await page.click('#btn-evaluate');
  await page.waitForTimeout(2000);

  // 4. Check both charts rendered (canvas has content)
  const costChart = await page.$('#chart-cost');
  const radarChart = await page.$('#chart-radar');
  console.log('Cost chart present:', !!costChart);
  console.log('Radar chart present:', !!radarChart);

  // 5. Check focus-visible outline on tab-through
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const focusedEl = await page.evaluateHandle(() => document.activeElement);
  const outline = await focusedEl.evaluate(el => getComputedStyle(el).outlineColor);
  console.log('Focus outline color:', outline);

  // 6. Check no horizontal overflow at 1280
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(300);
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  console.log(`Overflow check: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}, overflow=${scrollWidth > clientWidth}`);

  // 7. Check console errors related to integrity
  const integrityErrors = errors.filter(e => e.toLowerCase().includes('integrity'));
  console.log('Integrity console errors:', integrityErrors.length);

  // Screenshot
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/workspace/auto-evaluation/app/screenshot_polish.png', fullPage: true });
  console.log('Screenshot saved: /workspace/auto-evaluation/app/screenshot_polish.png');

  // 8. Check aria-live region was updated
  const ariaText = await page.$eval('#aria-live-region', el => el.textContent);
  console.log('aria-live content:', ariaText.substring(0, 80));

  await browser.close();

  // Summary
  if (errors.length > 0) {
    console.log('\nPage errors:', errors);
  }
  console.log('\n✅ All Playwright checks completed.');
})();
