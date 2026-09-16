const { chromium } = require('C:/Users/Deepak/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

const baseUrl = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:5174';
const products = Array.from({ length: 53 }, (_, index) => ({
  suitId: `loading-${index}`, title: `Collection Suit ${index}`, price: 500 + index * 100,
  stock: 5, product_category: 'suits', colors: [index % 2 ? 'Blue' : 'Pink'],
  images: ['/icons/pwa-512.png'],
}));

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    async function setup({ noObserver = false, fail = false, width = 390 } = {}) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: width < 768, hasTouch: width < 768, serviceWorkers: 'block' });
      await context.addInitScript(({ noObserver }) => {
        sessionStorage.setItem('hasSeenLaunch', 'true');
        sessionStorage.setItem('kamlesh_location_prompt_seen', 'true');
        sessionStorage.setItem('kamlesh_notification_prompt_seen', 'true');
        if (noObserver) delete window.IntersectionObserver;
      }, { noObserver });
      let requests = 0;
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.origin === baseUrl) return route.continue();
        if (url.pathname === '/api/products') {
          requests++;
          return route.fulfill(fail ? { status: 503, json: { error: 'Unavailable' } } : { json: products });
        }
        if (url.pathname.includes('taxonomy')) return route.fulfill({ json: { categories: [{ id: 'suits', label: 'Suits', subcategories: [] }] } });
        return route.fulfill({ json: /hero|banners|coupons/.test(url.pathname) ? [] : {} });
      });
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.clock.install();
      await page.goto(baseUrl);
      const collection = page.locator('#collection-section');
      const cards = collection.getByRole('heading', { level: 3, name: /^Collection Suit \d+$/ });
      return { context, page, collection, cards, errors, requests: () => requests, recover: () => { fail = false; } };
    }

    for (const width of [390, 1440]) {
      const run = await setup({ width });
      const { page, cards, collection } = run;
      await cards.nth(11).waitFor();
      assert.equal(await cards.count(), 12, 'Only the first batch should render initially');
      await cards.nth(11).scrollIntoViewIfNeeded();
      await cards.nth(23).waitFor();
      await cards.nth(18).scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      const before = await cards.allTextContents();
      const requestsBefore = run.requests();
      const scrollBefore = await page.evaluate(() => window.scrollY);
      const originalCard = await cards.nth(18).elementHandle();
      for (let cycle = 0; cycle < 3; cycle++) {
        await page.clock.fastForward(31000);
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        await page.waitForTimeout(150);
        assert.deepEqual(await cards.allTextContents(), before, 'Time and focus must not reset loaded products');
        assert.equal(run.requests(), requestsBefore, 'No repeated catalogue requests during browsing');
        assert.ok(await originalCard.evaluate(el => el.isConnected), 'Existing cards must stay mounted');
        assert.ok(Math.abs(await page.evaluate(() => window.scrollY) - scrollBefore) < 3, 'Scroll position must stay stable');
      }
      console.log(`PASS ${width}px: lazy append, stable cards and scroll across 93 seconds and focus events`);

      let previousCount = 0;
      while (await cards.count() < products.length) {
        const count = await cards.count();
        assert.ok(count > previousCount, 'Each scroll must make progress');
        previousCount = count;
        await cards.last().scrollIntoViewIfNeeded();
        await cards.nth(Math.min(count + 12, products.length) - 1).waitFor();
      }
      assert.equal(new Set(await cards.allTextContents()).size, products.length);
      assert.equal(await collection.getByRole('button', { name: 'Load More', exact: true }).count(), 0);
      console.log(`PASS ${width}px: every product loads once, including the final partial batch`);

      await collection.getByRole('heading', { level: 2, name: /Collection/ }).scrollIntoViewIfNeeded();
      if (width < 768) {
        await collection.getByRole('button', { name: 'Sort by: Featured' }).click();
        await page.getByRole('button', { name: 'Price: High to low', exact: true }).click();
      } else {
        await page.getByRole('combobox', { name: 'Sort by', exact: true }).selectOption('price_desc');
      }
      await page.waitForFunction(() => Array.from(document.querySelectorAll('#collection-section h3')).find(el => /^Collection Suit \d+$/.test(el.textContent))?.textContent === 'Collection Suit 52');
      const sortedCount = await cards.count();
      assert.ok(sortedCount < products.length && sortedCount % 12 === 0, 'Changing sort resets paging, with preloading for the viewport');
      assert.deepEqual(run.errors, []);
      console.log(`PASS ${width}px: sort resets paging correctly, no browser errors`);
      await run.context.close();
    }

    const fallback = await setup({ noObserver: true });
    await fallback.cards.nth(11).waitFor();
    await fallback.collection.getByRole('button', { name: 'Load More', exact: true }).click();
    await fallback.cards.nth(23).waitFor();
    assert.equal(await fallback.cards.count(), 24);
    assert.deepEqual(fallback.errors, []);
    await fallback.context.close();
    console.log('PASS manual loading works when IntersectionObserver is unavailable');

    const retry = await setup({ fail: true });
    await retry.collection.getByRole('alert').waitFor();
    retry.recover();
    await retry.collection.getByRole('button', { name: 'Try again', exact: true }).click();
    await retry.cards.nth(11).waitFor();
    assert.deepEqual(retry.errors, []);
    await retry.context.close();
    console.log('PASS failed collection request can be retried successfully');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
