const { chromium } = require('C:/Users/Deepak/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const baseUrl = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:5174';
const live = process.env.AUDIT_LIVE === '1';

(async () => {
  const { selectHeroSuits, selectLatestCoupon, describeHeroCoupon } = await import('../src/utils/homeHero.js');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width < 768, hasTouch: width < 768, serviceWorkers: 'block' });
      await context.addInitScript(() => {
        sessionStorage.setItem('hasSeenLaunch', 'true');
        sessionStorage.setItem('kamlesh_location_prompt_seen', 'true');
        sessionStorage.setItem('kamlesh_notification_prompt_seen', 'true');
      });
      const page = await context.newPage();
      const errors = [];
      const oldHeroRequests = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (request.url().includes('/hero-images')) oldHeroRequests.push(request.url()); });
      const productsResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/api/products' && response.ok());
      const couponsResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/api/coupons' && response.ok());
      await page.goto(baseUrl);
      const [products, coupons] = await Promise.all([productsResponse.then(response => response.json()), couponsResponse.then(response => response.json())]);
      const expected = selectHeroSuits(products);
      assert.ok(expected.length > 0, 'Live catalog contains eligible suits');
      const gallery = page.locator('[aria-roledescription="carousel"]');
      const main = width < 768 ? gallery.locator('a.z-10') : page.locator('section.hidden.md\\:flex a.z-20');
      await main.waitFor({ state: 'visible' });
      assert.equal(await main.getAttribute('href'), expected[0].productPath);
      await page.waitForFunction(() => [...document.querySelectorAll('.image-overlay')].filter(el => el.getBoundingClientRect().width > 0).every(el => el.complete && el.naturalWidth > 0));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (width < 768) {
        const offer = page.locator('[data-hero-offer]');
        const latest = selectLatestCoupon(coupons);
        await offer.waitFor();
        const expectedOffer = latest ? describeHeroCoupon(latest).title : 'Complimentary shipping';
        await page.waitForFunction(text => document.querySelector('[data-hero-offer]')?.textContent.includes(text), expectedOffer);
        const box = await gallery.boundingBox();
        const cdp = await context.newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + 250, y: box.y + 150 }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x + 80, y: box.y + 150 }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await cdp.detach();
        assert.equal(await main.getAttribute('href'), expected[1 % expected.length].productPath);
        await page.screenshot({ path: 'audit-results/home-hero-mobile.png' });
        if (!live) {
          for (const response of [{ json: [] }, { status: 503, json: { message: 'unavailable' } }, { json: [{ code: 'EXPIRED', discount: 500, discount_type: 'flat', expires_at: '2020-01-01' }] }]) {
            await page.route('**/api/coupons', route => route.fulfill(response));
            await page.reload();
            await page.locator('[data-hero-offer]').waitFor();
            assert.ok((await page.locator('[data-hero-offer]').textContent()).includes('Complimentary shipping'));
            await page.unroute('**/api/coupons');
          }
        }
      }
      assert.deepEqual(errors, []);
      assert.deepEqual(oldHeroRequests, []);
      console.log(JSON.stringify({ width, products: expected.map(item => item.alt), coupon: selectLatestCoupon(coupons)?.code, passed: true }));
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
