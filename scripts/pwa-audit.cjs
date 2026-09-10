const { chromium } = require('C:/Users/Deepak/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');

const baseUrl = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:4173';

(async () => {
  const results = [];
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'allow' });
  const page = await context.newPage();
  page.on('pageerror', error => console.error('PWA page error:', error.message));
  page.on('requestfailed', request => console.error('PWA request failed:', request.url(), request.failure()?.errorText));
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(30000);
  await context.route('**/*', route => new URL(route.request().url()).origin === baseUrl
    ? route.continue() : route.fulfill({ json: [] }));
  await context.addInitScript(() => {
    sessionStorage.setItem('hasSeenLaunch', 'true');
    sessionStorage.setItem('kamlesh_location_prompt_seen', 'true');
    sessionStorage.setItem('kamlesh_notification_prompt_seen', 'true');
  });

  async function test(name, fn) {
    try {
      await fn();
      results.push({ name, status: 'PASS' });
    } catch (error) {
      console.error('PWA page text:', await page.locator('body').innerText().catch(() => 'unavailable'));
      console.error('PWA cache URLs:', await page.evaluate(async () => {
        const urls = [];
        for (const key of await caches.keys()) urls.push(...(await (await caches.open(key)).keys()).map(request => request.url));
        return urls;
      }).catch(() => []));
      results.push({ name, status: 'FAIL', error: error.message.slice(0, 700) });
    }
  }

  await test('Manifest is installable and every declared icon is available', async () => {
    const response = await page.request.get(`${baseUrl}/manifest.webmanifest`);
    assert.equal(response.ok(), true);
    const manifest = await response.json();
    assert.equal(manifest.display, 'standalone');
    assert.equal(manifest.start_url, '/');
    assert.ok(manifest.icons.some(icon => icon.sizes === '192x192'));
    assert.ok(manifest.icons.some(icon => icon.sizes === '512x512' && icon.purpose === 'maskable'));
    for (const icon of manifest.icons) {
      const iconResponse = await page.request.get(new URL(icon.src, baseUrl).href);
      assert.equal(iconResponse.ok(), true, `${icon.src} was not available`);
      assert.match(iconResponse.headers()['content-type'] || '', /^image\/png/);
    }
  });

  await test('Service worker installs and controls the application', async () => {
    await page.goto(baseUrl, { waitUntil: 'load' });
    await page.evaluate(() => Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Service worker readiness timed out')), 15000))
    ]));
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await page.getByRole('button', { name: 'All Products', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)), true);
    const cacheKeys = await page.evaluate(() => caches.keys());
    assert.ok(cacheKeys.some(key => key.includes('kamlesh-suits')));
  });

  await test('Installed app shell opens while completely offline', async () => {
    await context.setOffline(true);
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'All Products', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
    await context.setOffline(false);
  });

  await test('Source inspection: push and notification-click handlers exist', async () => {
    const response = await page.request.get(`${baseUrl}/sw.js`);
    const source = await response.text();
    assert.match(source, /addEventListener\('push'/);
    assert.match(source, /addEventListener\('notificationclick'/);
    assert.match(source, /new URL\(event\.notification\.data\?\.url \|\| '\/', self\.location\.origin\)/);
  });

  fs.mkdirSync('audit-results', { recursive: true });
  fs.writeFileSync('audit-results/pwa.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
  if (results.some(result => result.status === 'FAIL')) process.exitCode = 1;
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
