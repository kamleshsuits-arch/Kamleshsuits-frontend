const { chromium } = require('C:/Users/Deepak/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const base = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:5174';
const product = { suitId: 'progress-suit', title: 'Progress Test Suit', price: 1200, stock: 1, product_category: 'suits', images: ['/icons/pwa-512.png'], colors: ['Red'] };

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const [width, fail] of [[390, false], [1440, false], [390, true]]) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, serviceWorkers: 'block' });
      await context.addInitScript(() => {
        sessionStorage.setItem('kamlesh_location_prompt_seen', 'true');
        sessionStorage.setItem('kamlesh_notification_prompt_seen', 'true');
        window.loadingSamples = [];
        new MutationObserver(() => {
          const bar = document.querySelector('[role="progressbar"][aria-label="Loading progress"]');
          if (!bar) return;
          const value = Number(bar.getAttribute('aria-valuenow'));
          const label = Number(document.querySelector('[data-loading-percentage]')?.textContent.replace('%', ''));
          const fill = parseFloat(document.querySelector('[data-loading-fill]')?.style.width);
          window.loadingSamples.push({ value, label, fill });
        }).observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
      });
      let release;
      const gate = new Promise(resolve => { release = resolve; });
      await context.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin === base) return route.continue();
        if (url.pathname === '/api/products') {
          await gate;
          return route.fulfill(fail ? { status: 503, json: {} } : { json: [product] });
        }
        return route.fulfill({ json: [] });
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base);
      await page.waitForFunction(() => document.querySelector('[data-loading-percentage]')?.textContent === '40%');
      assert.equal(await page.locator('[data-loading-fill]').evaluate(el => el.style.width), '40%');
      assert.equal(await page.locator('.launch-screen').isVisible(), true);
      if (width === 390 && !fail) await page.screenshot({ path: 'audit-results/loading-progress-mobile.png' });
      release();
      await page.waitForFunction(() => document.querySelector('[data-loading-percentage]')?.textContent === '100%');
      assert.equal(await page.locator('[data-loading-fill]').evaluate(el => el.style.width), '100%');
      await page.locator('.launch-screen').waitFor({ state: 'detached' });
      const samples = await page.evaluate(() => window.loadingSamples);
      assert.ok(samples.some(sample => sample.value > 0 && sample.value < 40));
      assert.ok(samples.some(sample => sample.value === 100));
      samples.forEach((sample, i) => {
        assert.equal(sample.label, sample.value);
        assert.equal(sample.fill, sample.value);
        assert.ok(sample.value >= 0 && sample.value <= 100);
        if (i) assert.ok(sample.value >= samples[i - 1].value, 'Progress does not move backwards');
      });
      assert.equal(await page.evaluate(() => sessionStorage.getItem('hasSeenLaunch')), 'true');
      if (fail) await page.getByRole('button', { name: 'Try again', exact: true }).waitFor();
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ width, failedRequest: fail, synchronizedPercentageAndBar: true, completion: 100, passed: true }));
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
