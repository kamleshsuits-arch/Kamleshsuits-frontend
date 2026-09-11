const { chromium } = require('C:/Users/Deepak/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    const page = await context.newPage();
    let status = 'Awaiting Confirmation';
    let fail = false;
    const order = () => ({ orderId: '#ORD-1234567890123-1234', status, total: 1000, items: [], created_at: '2026-09-10T00:00:00Z' });
    await context.addInitScript(() => {
      sessionStorage.setItem('hasSeenLaunch', 'true');
      sessionStorage.setItem('kamlesh_notification_prompt_seen', 'true');
      localStorage.setItem('kamlesh_guest_order_refs', JSON.stringify([{ orderId: '#ORD-1234567890123-1234', phone: '9999999999' }]));
    });
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1') return route.continue();
      if (url.pathname.endsWith('/lookup-by-phone')) return route.fulfill({ status: fail ? 500 : 200, json: fail ? { message: 'Could not find orders right now' } : [order()] });
      if (url.pathname.endsWith('/orders/track')) return route.fulfill({ json: order() });
      return route.fulfill({ json: [] });
    });
    await page.goto('http://127.0.0.1:5174/track-order');
    await page.getByRole('textbox', { name: 'Mobile number' }).fill('9999999999');
    fail = true;
    await page.getByRole('button', { name: 'Find Orders', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'saved orders below' }).waitFor();
    assert.equal(await page.locator('article').count(), 1);
    console.log('PASS: failed phone search explains independent saved details');
    fail = false;
    await page.getByRole('button', { name: 'Find Orders', exact: true }).click();
    await page.getByRole('button').filter({ hasText: '#ORD-1234567890123-1234' }).click();
    await page.locator('article').waitFor();
    await page.waitForTimeout(200);
    status = 'Confirmed';
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.locator('article [aria-label="Order status: Confirmed"]').waitFor();
    assert.equal(await page.getByRole('alert').count(), 0);
    console.log('PASS: focused page refreshes selected order and clears error');
    fail = true;
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await page.getByRole('status').filter({ hasText: 'last loaded details' }).waitFor();
    assert.equal(await page.locator('article').count(), 1);
    fail = false;
    status = 'Shipped';
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await page.locator('article [aria-label="Order status: Shipped"]').waitFor();
    console.log('PASS: refresh failure preserves order and reconnect recovers');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
