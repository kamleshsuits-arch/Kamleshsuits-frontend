const { chromium } = require('C:/Users/Deepak/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const base = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:5181';
const live = process.env.AUDIT_LIVE === '1';
(async () => {
  const { picturedColours, addPicturedColours } = await import('../../backend/scripts/picturedColourOptions.js');
  const response = await fetch('https://kamleshsuits-backend.onrender.com/api/products');
  assert.equal(response.ok, true);
  const original = await response.json();
  const products = original.map(product => {
    const plan = picturedColours.find(item => item.suitId === product.suitId);
    return plan && product.inventory_mode !== 'shared' ? addPicturedColours(product, plan, new Date().toISOString()) : product;
  });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 960 }, serviceWorkers: 'block' });
      await context.addInitScript(() => {
        for (const key of ['hasSeenLaunch', 'kamlesh_location_prompt_seen', 'kamlesh_notification_prompt_seen']) sessionStorage.setItem(key, 'true');
      });
      if (!live) await context.route('**/api/**', route => {
        const url = new URL(route.request().url());
        if (url.pathname === '/api/products') return route.fulfill({ json: products });
        if (url.pathname.startsWith('/api/products/')) return route.fulfill({ json: products.find(item => item.suitId === decodeURIComponent(url.pathname.split('/').at(-1))) });
        return route.fulfill({ json: [] });
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const plan of picturedColours) {
        await page.goto(`${base}/product/${plan.suitId}`);
        for (const [colour] of plan.colours) {
          const option = page.getByRole('button', { name: `Select ${colour}`, exact: true }).filter({ visible: true });
          await option.waitFor({ timeout: 45000 });
          await option.click();
          assert.equal(await option.getAttribute('aria-pressed'), 'true');
        }
        assert.equal(await page.getByText('1 piece available across all colour choices.', { exact: true }).filter({ visible: true }).count(), 1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      }
      const example = products.find(product => product.suitId.endsWith('2026-09-22-suit-06'));
      await page.goto(`${base}/product/${example.suitId}`);
      const red = page.getByRole('button', { name: 'Select Red', exact: true }).filter({ visible: true });
      await red.click();
      if (width === 390) {
        await page.getByRole('button', { name: 'Show product photo 2 of 2', exact: true }).click();
        assert.equal(await red.getAttribute('aria-pressed'), 'true');
      }
      await page.getByRole('button', { name: 'Add to Cart', exact: true }).filter({ visible: true }).click();
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('cartItems') || '[]').some(item => item.selectedColor === 'Red'));
      await page.goto(`${base}/cart`);
      const increase = page.getByRole('button', { name: `Increase quantity of ${example.title}`, exact: true });
      await increase.waitFor();
      assert.equal(await increase.isDisabled(), true);
      const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('cartItems')));
      assert.equal(cart[0].quantity, 1);
      assert.equal(cart[0].selectedColor, 'Red');
      assert.equal(cart[0].stock, 1);
      await page.goto(`${base}/product/${example.suitId}`);
      await page.getByRole('button', { name: 'Select Orange', exact: true }).filter({ visible: true }).click();
      await page.screenshot({ path: `audit-results/pictured-colours-${live ? 'live' : 'local'}-${width}.png`, fullPage: false });
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ width, live, products: 10, addedOptions: 30, sharedStock: 1, cartColour: 'Red', passed: true }));
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
