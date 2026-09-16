const { chromium } = require('C:/Users/Deepak/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const baseUrl = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:5174';
const item = (suitId, title, fields = {}) => ({ suitId, title, product_category: 'suits', product_subcategory: 'Stitched Suit', price: 1000, type: 'product', fabric_family: 'Cotton', colors: ['Blue'], stock: 5, image: '/icons/pwa-512.png', images: ['/icons/pwa-512.png'], ...fields });
const products = [
  item('blanket', 'Only Blanket', { product_category: 'blankets', product_subcategory: 'Blanket' }),
  item('sheet', 'Selected Bed Sheet', { product_category: 'bed-khat-sheets', product_subcategory: 'Bed Sheet' }),
  item('sheet-match', 'Similar Bed Sheet', { product_category: 'bed-khat-sheets', product_subcategory: 'Bed Sheet', price: 1100 }),
  item('khat', 'Khat Sheet', { product_category: 'bed-khat-sheets', product_subcategory: 'Khat Sheet' }),
  item('current', 'Selected Cotton Suit', { colors: ['Blue', 'Maroon'], variants: [{ id: 'blue', colorName: 'Blue', images: ['/icons/pwa-512.png'], stock: 5 }, { id: 'maroon', colorName: 'Maroon', images: ['/icons/pwa-192.png'], stock: 5 }] }),
  item('far', 'Different Silk Suit', { price: 8000, colors: ['Pink'], fabric_family: 'Silk' }),
  item('maroon', 'Similar Maroon Suit', { price: 1050, colors: ['Maroon'] }),
  item('blue', 'Similar Blue Suit', { price: 1100 }),
];

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: width < 768, hasTouch: width < 768, serviceWorkers: 'block' });
      await context.addInitScript(() => {
        sessionStorage.setItem('hasSeenLaunch', 'true');
        sessionStorage.setItem('kamlesh_location_prompt_seen', 'true');
        sessionStorage.setItem('kamlesh_notification_prompt_seen', 'true');
      });
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.origin === baseUrl) return route.continue();
        if (url.pathname === '/api/products') return route.fulfill({ json: products });
        if (url.pathname.startsWith('/api/products/')) return route.fulfill({ json: products.find(p => p.suitId === url.pathname.split('/').pop()) });
        return route.fulfill({ json: [] });
      });
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const recommendations = page.getByRole('region', { name: 'You May Also Like', exact: true });
      const titles = recommendations.locator('h3');

      await page.goto(`${baseUrl}/product/current`);
      await recommendations.waitFor();
      assert.deepEqual(await titles.allTextContents(), ['Similar Blue Suit', 'Similar Maroon Suit', 'Different Silk Suit']);
      await page.getByRole('button', { name: 'Select Maroon', exact: true }).filter({ visible: true }).click();
      await page.waitForFunction(() => document.querySelector('[aria-label="You May Also Like"] h3')?.textContent === 'Similar Maroon Suit');
      assert.deepEqual(await titles.allTextContents(), ['Similar Maroon Suit', 'Similar Blue Suit', 'Different Silk Suit']);
      await titles.first().click();
      await page.waitForURL('**/product/maroon');
      await page.getByRole('heading', { level: 1, name: 'Similar Maroon Suit' }).waitFor();
      await recommendations.waitFor();
      assert.ok(!(await titles.allTextContents()).includes('Similar Maroon Suit'));
      console.log(`PASS ${width}px: only suits, similarity ranking, selected-color updates, recommendation navigation`);

      await page.goto(`${baseUrl}/product/sheet`);
      await recommendations.waitFor();
      assert.deepEqual(await titles.allTextContents(), ['Similar Bed Sheet']);
      console.log(`PASS ${width}px: bedsheets exclude suits and khat sheets, without unrelated filler`);

      await page.goto(`${baseUrl}/product/blanket`);
      await page.getByRole('heading', { level: 1, name: 'Only Blanket' }).waitFor();
      await page.waitForTimeout(250);
      assert.equal(await recommendations.count(), 0);
      await page.goto(`${baseUrl}/wishlist`);
      await recommendations.waitFor();
      assert.deepEqual(await titles.allTextContents(), products.map(p => p.title));
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: no unrelated suggestions for a lone category, wishlist preserved, no browser errors`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
