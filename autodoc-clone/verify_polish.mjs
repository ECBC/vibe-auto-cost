/**
 * verify_polish.mjs — Playwright self-test for Phase-1 polish fixes.
 * Run: node verify_polish.mjs
 */
import { chromium } from 'playwright';
import { execSync, spawn } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';

// 1. Build check
console.log('--- Step 1: Build ---');
try {
  execSync('npm run build', { cwd: '/workspace/autodoc-clone', stdio: 'pipe' });
  console.log('✅ Build exit 0');
} catch (e) {
  console.error('❌ Build failed', e.message);
  process.exit(1);
}

// 2. Start dev server
console.log('--- Step 2: Dev server ---');
const server = spawn('npx', ['vite', '--port', '4173', '--strictPort'], {
  cwd: '/workspace/autodoc-clone',
  stdio: 'pipe',
  env: { ...process.env, NODE_ENV: 'development' },
});
await sleep(3000); // wait for server

const BASE = 'http://localhost:4173';

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const viewports = [
  { width: 1280, height: 800, label: '1280' },
  { width: 1440, height: 900, label: '1440' },
  { width: 1920, height: 1080, label: '1920' },
];

const results = {};

for (const vp of viewports) {
  console.log(`\n--- Viewport ${vp.label}×${vp.height} ---`);
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();

  // Collect console errors
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto(BASE, { waitUntil: 'networkidle' });

  // 3. Overflow check
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const innerWidth = await page.evaluate(() => window.innerWidth);
  const overflow = scrollWidth > innerWidth;
  console.log(`  scrollWidth=${scrollWidth}, innerWidth=${innerWidth}, overflow=${overflow}`);
  results[vp.label] = { scrollWidth, innerWidth, overflow };

  if (overflow) {
    console.error(`  ❌ Horizontal overflow at ${vp.label}!`);
  } else {
    console.log(`  ✅ No horizontal overflow`);
  }

  // 4. Bottom Buscar CTA hover test
  // Find the bottom full-width Buscar button
  const ctaBtn = page.locator('button:has-text("Buscar")').last();

  // Rest color
  const restBg = await ctaBtn.evaluate(el => getComputedStyle(el).backgroundColor);
  console.log(`  CTA rest bg: ${restBg}`);

  // Hover
  await ctaBtn.hover();
  await sleep(350); // wait for transition
  const hoverBg = await ctaBtn.evaluate(el => getComputedStyle(el).backgroundColor);
  console.log(`  CTA hover bg: ${hoverBg}`);

  // Verify colors
  const restHex = rgbToHex(restBg);
  const hoverHex = rgbToHex(hoverBg);
  console.log(`  CTA rest hex: ${restHex}, hover hex: ${hoverHex}`);

  if (restHex.toLowerCase() === '#0068d7') {
    console.log('  ✅ CTA rest color correct');
  } else {
    console.error(`  ❌ CTA rest color wrong: ${restHex}`);
  }
  if (hoverHex.toLowerCase() === '#0074f1') {
    console.log('  ✅ CTA hover color correct');
  } else {
    console.error(`  ❌ CTA hover color wrong: ${hoverHex}`);
  }

  // Never gray
  if (restHex.toLowerCase() === '#9c9c9c' || hoverHex.toLowerCase() === '#9c9c9c') {
    console.error('  ❌ CTA is gray!');
  } else {
    console.log('  ✅ CTA never gray');
  }

  // Console errors
  if (errors.length === 0) {
    console.log('  ✅ No console errors');
  } else {
    console.error(`  ❌ Console errors: ${errors.join('; ')}`);
  }

  // 6. Screenshots for 1280 and 1440
  if (vp.label === '1280' || vp.label === '1440') {
    const path = `/workspace/clone-web/team-log/screens/clone_polish_${vp.label}.png`;
    await page.screenshot({ path, fullPage: true });
    console.log(`  📸 Screenshot: ${path}`);
  }

  await context.close();
}

await browser.close();
server.kill();

console.log('\n=== SUMMARY ===');
for (const [label, r] of Object.entries(results)) {
  console.log(`  ${label}: scrollWidth=${r.scrollWidth} innerWidth=${r.innerWidth} overflow=${r.overflow ? '❌' : '✅'}`);
}
console.log('Done.');

function rgbToHex(rgb) {
  const m = rgb.match(/(\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return rgb;
  return '#' + [m[1], m[2], m[3]].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}
