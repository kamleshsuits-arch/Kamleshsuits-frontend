const { chromium } = require('C:/Users/Deepak/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const baseUrl = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:5174';
const products = Array.from({ length: 40 }, (_, index) => ({
  suitId: `toolbar-${index}`, title: `Toolbar Suit ${index}`, price: 1000 + index * 100,
  discount: 20, stock: 5, product_category: 'suits', colors: ['Pink'],
  created_at: '2026-09-01', images: ['/icons/pwa-512.png'],
}));

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const profile of [{ standalone: false, inset: 0 }, { standalone: true, inset: 0 }, { standalone: true, inset: 47 }]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
      await context.addInitScript(({ standalone }) => {
        if (standalone) Object.defineProperty(navigator, 'standalone', { get: () => true });
        sessionStorage.setItem('hasSeenLaunch', 'true');
        sessionStorage.setItem('kamlesh_location_prompt_seen', 'true');
        sessionStorage.setItem('kamlesh_notification_prompt_seen', 'true');
      }, profile);
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.origin === baseUrl) return route.continue();
        if (url.pathname === '/api/products') return route.fulfill({ json: products });
        if (url.pathname.includes('taxonomy')) return route.fulfill({ json: { categories: [{ id: 'suits', label: 'Suits', subcategories: [] }] } });
        return route.fulfill({ json: [] });
      });
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const path of ['/new-arrivals', '/sale', '/']) {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(baseUrl + path);
        if (profile.standalone) {
          await page.waitForFunction(() => document.documentElement.classList.contains('pwa-standalone'));
          await page.addStyleTag({ content: `html.pwa-standalone { --app-safe-top: ${profile.inset}px !important; }` });
          await page.evaluate(() => window.dispatchEvent(new Event('resize')));
        }
        const toolbar = page.locator('[data-collection-toolbar]');
        const slot = page.locator('[data-collection-slot]');
        const filter = page.getByRole('button', { name: /^Filters/ });
        await toolbar.waitFor();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(250);
        const layout = await slot.evaluate(el => {
          const card = el.parentElement.querySelector('h3.line-clamp-2');
          const offset = document.querySelector('[data-store-header]').getBoundingClientRect().height;
          return {
            offset,
            threshold: el.previousElementSibling.getBoundingClientRect().top + scrollY - offset,
            cardTop: card.getBoundingClientRect().top + scrollY,
            slotHeight: el.getBoundingClientRect().height,
          };
        });
        assert.equal(layout.offset, 56 + profile.inset);
        assert.equal((await filter.boundingBox()).height, 48);
        const samples = await slot.evaluate(async (el, target) => {
          window.scrollTo({ top: target, behavior: 'instant' });
          const frames = [];
          const start = performance.now();
          while (performance.now() - start < 500) {
            await new Promise(requestAnimationFrame);
            const card = el.parentElement.querySelector('h3.line-clamp-2');
            frames.push({ scroll: scrollY, slot: el.getBoundingClientRect().height, cardTop: card.getBoundingClientRect().top + scrollY });
          }
          return frames;
        }, layout.threshold + 3);
        assert.ok(samples.every(sample => Math.abs(sample.slot - layout.slotHeight) < 1), 'Compacting must never change document flow');
        assert.ok(samples.every(sample => Math.abs(sample.cardTop - layout.cardTop) < 1), 'Product positions must not jump during compact animation');
        assert.ok(samples.every(sample => Math.abs(sample.scroll - (layout.threshold + 3)) < 1), 'Scroll anchoring must not move the page');
        assert.equal(await toolbar.getAttribute('data-pinned'), 'true');
        await page.waitForTimeout(250);
        assert.equal(await toolbar.evaluate(el => getComputedStyle(el).position), 'fixed');
        assert.ok(await toolbar.evaluate(el => el.parentElement === document.body), 'Pinned controls are outside page clipping/transform ancestors');
        assert.equal((await filter.boundingBox()).height, 44, `Pinned buttons are compact but remain touch-friendly: ${JSON.stringify(await filter.evaluate(el => ({ height: getComputedStyle(el).height, minHeight: getComputedStyle(el).minHeight, font: getComputedStyle(document.documentElement).fontSize, styles: [...document.querySelectorAll('link[rel=stylesheet]')].map(el => el.href) })))}`);
        assert.equal((await page.locator('[data-collection-surface]').boundingBox()).height, 57);

        for (const delta of [20, 80, 200, 40, 3, -2, -4, 5, 1]) {
          await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), layout.threshold + delta);
          await page.waitForTimeout(50);
          assert.equal(await toolbar.getAttribute('data-pinned'), 'true', 'Small reversals near the boundary must not toggle compact mode');
          if (delta > 0) assert.ok(Math.abs((await toolbar.boundingBox()).y - layout.offset) < 1);
        }

        // Exercise real touch-scroll events and sample every painted frame, not just scrollTo endpoints.
        await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), layout.threshold + 300);
        await page.waitForTimeout(100);
        await page.evaluate(() => {
          window.toolbarFrames = [];
          window.recordToolbar = true;
          const record = () => {
            if (!window.recordToolbar) return;
            const el = document.querySelector('[data-collection-toolbar]');
            window.toolbarFrames.push({ top: el.getBoundingClientRect().top, height: el.getBoundingClientRect().height, pinned: el.dataset.pinned });
            requestAnimationFrame(record);
          };
          requestAnimationFrame(record);
        });
        const touch = await context.newCDPSession(page);
        await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 280, y: 640 }] });
        for (let y = 610; y >= 190; y -= 30) {
          await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 280, y }] });
          await page.waitForTimeout(16);
        }
        await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForTimeout(350);
        const touchFrames = await page.evaluate(() => { window.recordToolbar = false; return window.toolbarFrames; });
        await touch.detach();
        assert.ok(touchFrames.length > 5);
        assert.ok(touchFrames.every(frame => frame.pinned === 'true' && Math.abs(frame.top - layout.offset) < 1 && frame.height === 57), 'Touch and momentum scrolling cannot move or resize pinned controls');
        await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
        await page.waitForTimeout(100);
        assert.ok(Math.abs((await toolbar.boundingBox()).y - layout.offset) < 1, 'Toolbar remains fixed even when the page footer enters view');
        await page.setViewportSize({ width: 390, height: 760 });
        await page.waitForTimeout(100);
        assert.equal(await toolbar.getAttribute('data-pinned'), 'true');
        await filter.click();
        await page.getByRole('dialog', { name: 'Filters', exact: true }).waitFor();
        await page.keyboard.press('Escape');
        const sort = page.getByRole('button', { name: /^Sort by:/ });
        await sort.click();
        await page.getByRole('button', { name: 'Price: Low to high', exact: true }).click();
        await page.getByRole('button', { name: 'Sort by: Price: Low to high' }).waitFor();

        if (profile.inset === 47 && path !== '/') {
          fs.mkdirSync('audit-results', { recursive: true });
          await page.screenshot({ path: `audit-results/pwa-${path.slice(1)}-compact.png` });
        }
        await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), layout.threshold - 15);
        await page.waitForTimeout(250);
        assert.equal(await toolbar.getAttribute('data-pinned'), 'false');
        assert.equal((await filter.boundingBox()).height, 48);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        console.log(`PASS ${path} ${profile.standalone ? 'standalone' : 'browser'} inset=${profile.inset}: fixed body layer, no touch/momentum jitter, footer, compact controls, boundary, resize and dialogs`);
      }
      assert.deepEqual(errors, []);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
