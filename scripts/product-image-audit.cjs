const { chromium } = require('C:/Users/Deepak/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:5177';
const host = 'https://kamlesh-suits-images.s3.ap-south-1.amazonaws.com';
const photo = fs.readFileSync('public/icons/pwa-512.png');
const product = { suitId: 'image-test', title: 'Red Festival Suit', price: 1299, stock: 1, discount: 20, product_category: 'suits', colors: ['Red'], images: [`${host}/audit-one.webp`, `${host}/audit-two.webp`], created_at: new Date().toISOString() };

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
      await context.addInitScript(() => {
        for (const key of ['hasSeenLaunch', 'kamlesh_location_prompt_seen', 'kamlesh_notification_prompt_seen']) sessionStorage.setItem(key, 'true');
      });
      let release;
      let gate = new Promise(resolve => { release = resolve; });
      let mode = 'success';
      let originals = 0;
      let optimized = 0;
      await context.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.pathname === '/_vercel/image' || url.origin === host) {
          if (url.origin === host) originals++; else optimized++;
          await gate;
          if (mode === 'error' || (mode === 'fallback' && url.pathname === '/_vercel/image')) return route.fulfill({ status: 503, body: '' });
          return route.fulfill({ contentType: 'image/png', body: photo });
        }
        if (url.origin === base) return route.continue();
        if (url.pathname === '/api/products') return route.fulfill({ json: [product] });
        if (url.pathname === '/api/products/image-test') return route.fulfill({ json: product });
        if (url.pathname.includes('taxonomy')) return route.fulfill({ json: { categories: [{ id: 'suits', label: 'Suits', subcategories: [] }] } });
        return route.fulfill({ json: /hero|banners|coupons/.test(url.pathname) ? [] : {} });
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const path of ['/new-arrivals', '/sale', '/product']) {
        gate = new Promise(resolve => { release = resolve; });
        await page.goto(base + path);
        const frame = page.locator('.product-image').first();
        await frame.scrollIntoViewIfNeeded();
        await page.waitForFunction(() => document.querySelector('.product-image')?.dataset.imageState === 'loading');
        const before = await frame.boundingBox();
        assert.ok(before.width > 100 && before.height > 100);
        assert.equal(await frame.evaluate(el => getComputedStyle(el).cursor), 'progress');
        assert.equal(await frame.locator('.product-image__orbit').evaluate(el => getComputedStyle(el).animationName), 'none');
        if (width === 390 && path === '/new-arrivals') await page.screenshot({ path: 'audit-results/product-image-loading-mobile.png' });
        release();
        await page.waitForFunction(() => document.querySelector('.product-image')?.dataset.imageState === 'loaded');
        assert.equal(await frame.locator('.product-image__veil').count(), 0);
        const after = await frame.boundingBox();
        assert.equal(after.height, before.height, 'Loading must not change card height');
        assert.ok(await frame.locator('img').evaluate(el => el.currentSrc.includes('/_vercel/image?')));
      }
      assert.equal(originals, 0, 'Do not fetch originals when optimized photos succeed');
      assert.ok(optimized > 0);

      mode = 'fallback';
      await page.goto(base + '/sale');
      await page.waitForFunction(() => document.querySelector('.product-image')?.dataset.imageState === 'loaded');
      assert.ok(await page.locator('.product-image img').first().evaluate(el => el.currentSrc.includes('amazonaws.com')));
      assert.ok(originals > 0);

      mode = 'error';
      await page.goto(base + '/new-arrivals');
      const retry = page.getByRole('button', { name: 'Retry image: Red Festival Suit' });
      await retry.waitFor();
      mode = 'success';
      await retry.click();
      await page.waitForFunction(() => document.querySelector('.product-image')?.dataset.imageState === 'loaded');
      assert.ok(page.url().endsWith('/new-arrivals'), 'Retry must not open the product');

      await page.goto(base + '/product/image-test');
      const main = page.locator('[role="button"][aria-label="Enlarge image of Red Festival Suit"]');
      await main.locator('[data-image-state="loaded"]').first().waitFor();
      const bounds = await main.boundingBox();
      assert.ok(bounds.height > 250, 'Main gallery retains its height');
      const thumb = width < 768 ? page.getByRole('button', { name: 'Show product photo 2 of 2' }) : page.locator('.product-image[data-compact]:visible').filter({ has: page.locator('img[src*="audit-two"]') }).first();
      await thumb.click();
      await page.waitForFunction(() => document.querySelector('[aria-label="Enlarge image of Red Festival Suit"] img')?.currentSrc.includes('audit-two'));
      await main.click();
      await page.locator('.fixed.z-\\[100\\] .product-image').first().waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ width, loading: true, responsive: true, fallback: true, retry: true, gallery: true, passed: true }));
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
