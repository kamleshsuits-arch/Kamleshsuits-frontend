const { chromium } = require('C:/Users/Deepak/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const baseUrl = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:5174';
const products = Array.from({ length: 30 }, (_, index) => ({
  suitId: `section-${index}`, title: `Audit Item ${index}`, price: (index + 1) * 100,
  discount: index % 3 ? index * 2 : 0, rating: index % 5,
  created_at: `2026-08-${String(index + 1).padStart(2, '0')}`,
  product_category: index % 2 ? 'dupatta' : 'suits', colors: [index % 2 ? 'Blue' : 'Pink'],
  categories: ['Festive'], stock: 5, images: ['/icons/pwa-512.png'],
}));

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
    await context.addInitScript(() => {
      sessionStorage.setItem('hasSeenLaunch', 'true');
      sessionStorage.setItem('kamlesh_location_prompt_seen', 'true');
      sessionStorage.setItem('kamlesh_notification_prompt_seen', 'true');
    });
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin === baseUrl) return route.continue();
      let data = [];
      if (url.pathname === '/api/products') data = products;
      else if (url.pathname.includes('taxonomy')) data = { categories: [{ id: 'suits', label: 'Suits' }, { id: 'dupatta', label: 'Dupatta' }] };
      else if (url.pathname === '/api/coupons') data = [{ code: 'SCOPED', category_ids: ['dupatta'], discount_type: 'percent', discount: 10 }];
      return route.fulfill({ json: data });
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const cards = page.getByRole('heading', { level: 3, name: /^Audit Item \d+$/ });
    fs.mkdirSync('audit-results', { recursive: true });
    for (const path of ['/new-arrivals', '/sale', '/new-arrivals?category=dupatta', '/new-arrivals?voucher=SCOPED&category=suits']) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(baseUrl + path);
      const isSale = path === '/sale';
      const scoped = path.includes('?');
      const expected = products.filter(p => (!isSale || p.discount > 0) && (!scoped || p.product_category === 'dupatta'));
      if (path.includes('voucher=')) await page.getByText('Availability and voucher limits are checked at checkout.').waitFor();
      await cards.last().waitFor();
      assert.equal(await cards.count(), expected.length);
      const defaultSort = isSale ? 'Biggest discount' : 'Newest first';
      const filterButton = page.getByRole('button', { name: /^Filters/ });
      await page.getByRole('button', { name: `Sort by: ${defaultSort}` }).waitFor();
      await cards.nth(10).scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const toolbar = page.locator('[data-pinned]');
      const position = await toolbar.boundingBox();
      assert.ok(position.y >= 55 && position.y <= 57, 'Toolbar remains below the header when scrolling');
      if (!scoped) await page.screenshot({ path: `audit-results/${isSale ? 'sale' : 'new'}-mobile-controls.png` });

      await filterButton.click();
      const sheet = page.getByRole('dialog', { name: 'Filters', exact: true });
      assert.ok(await sheet.evaluate(el => el.matches(':modal')));
      assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
      const color = expected[0].colors[0];
      await sheet.getByRole('button', { name: color, exact: true }).click();
      const matching = expected.filter(p => p.colors.includes(color));
      await sheet.getByRole('button', { name: `Show ${matching.length} products`, exact: true }).click();
      assert.equal(await cards.count(), matching.length);
      assert.equal(await filterButton.innerText(), 'Filters\n1');

      await page.getByRole('button', { name: `Sort by: ${defaultSort}` }).click();
      await page.getByRole('button', { name: 'Price: Low to high', exact: true }).click();
      assert.deepEqual(await cards.allTextContents(), matching.map(p => p.title));
      await filterButton.click();
      await sheet.getByRole('button', { name: 'Clear all', exact: true }).click();
      await sheet.getByRole('spinbutton', { name: 'Maximum price' }).fill('1');
      await sheet.getByRole('button', { name: 'Show 0 products', exact: true }).click();
      await page.getByText('No products match these filters.', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Reset Filters', exact: true }).click();
      assert.equal(await cards.count(), expected.length, 'Reset preserves sale/category/voucher scope');
      await page.getByRole('button', { name: 'Sort by: Price: Low to high' }).waitFor();
      assert.deepEqual(await cards.allTextContents(), expected.map(p => p.title));

      for (const width of [320, 768]) {
        await page.setViewportSize({ width, height: 700 });
        await filterButton.click();
        const footer = await sheet.getByRole('button', { name: `Show ${expected.length} products`, exact: true }).boundingBox();
        assert.ok(footer.y >= 0 && footer.y + footer.height <= 700);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.keyboard.press('Escape');
        assert.ok(await filterButton.evaluate(el => el === document.activeElement));
      }
      await filterButton.click();
      await page.setViewportSize({ width: 1440, height: 1000 });
      await sheet.waitFor({ state: 'detached' });
      assert.equal(await filterButton.isVisible(), false);
      console.log(`PASS ${path}: sticky toolbar, filters, sorting, empty/reset, scope, responsive sheets and focus`);
    }
    assert.deepEqual(errors, []);
    console.log('PASS no browser errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
