const { chromium } = require('C:/Users/Deepak/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const base = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:5174';
(async () => {
  const { selectKarwaChauthSuits } = await import('../src/utils/karwaChauth.js');
  const { selectHeroSuits } = await import('../src/utils/homeHero.js');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [320, 390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width < 768, hasTouch: width < 768, serviceWorkers: 'block', reducedMotion: 'reduce' });
      await context.addInitScript(() => {
        sessionStorage.setItem('hasSeenLaunch', 'true');
        sessionStorage.setItem('kamlesh_location_prompt_seen', 'true');
        sessionStorage.setItem('kamlesh_notification_prompt_seen', 'true');
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const catalogResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/api/products' && response.ok());
      await page.goto(base);
      const products = await (await catalogResponse).json();
      const expected = width < 768 ? selectHeroSuits(selectKarwaChauthSuits(products), { preserveOrder: true }) : selectHeroSuits(products);
      const main = width < 768 ? page.locator('[aria-roledescription="carousel"] a.z-10') : page.locator('section.hidden.md\\:flex a.z-20');
      await main.waitFor({ state: 'visible' });
      assert.equal(await main.getAttribute('href'), expected[0].productPath);
      if (width < 768) {
        await page.getByText('Karwa Chauth Special', { exact: true }).waitFor();
        await page.getByText('Shop ₹3,000 · Pay ₹2,700', { exact: true }).waitFor();
        assert.match(await page.locator('[data-hero-offer]').innerText(), /Use KARWA10/);
        assert.equal(await page.locator('[data-hero-offer] a').getAttribute('href'), '/new-arrivals?voucher=KARWA10');
        const galleryImages = await page.locator('[aria-roledescription="carousel"] img').evaluateAll(images => images.map(img => img.src));
        assert.ok(galleryImages.includes(expected[0].src));
        const picks = selectKarwaChauthSuits(products).slice(0, 6);
        assert.ok(picks.filter(product => product.festivalRed).length >= 4, 'At least four red-toned suits lead the mobile hero');
        const row = page.locator('[data-karwa-collection]');
        await row.scrollIntoViewIfNeeded();
        await page.waitForFunction(() => [...document.querySelectorAll('[data-karwa-collection] img')].slice(0, 2).every(img => img.complete && img.naturalWidth > 0));
        assert.equal(await row.locator('img').first().getAttribute('src'), picks[0].festivalImage);
        await page.screenshot({ path: `audit-results/karwa-collection-${width}.png` });
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: `audit-results/karwa-hero-${width}.png` });
        await page.locator('[data-hero-offer] a').click();
        await page.waitForURL('**/new-arrivals?voucher=KARWA10');
        await page.getByText('KARWA10', { exact: true }).first().waitFor();
      } else {
        assert.equal(await page.locator('[data-karwa-collection]').isVisible(), false);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No horizontal page overflow');
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ width, firstSuit: expected[0].alt, heroImages: expected.length, passed: true }));
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
