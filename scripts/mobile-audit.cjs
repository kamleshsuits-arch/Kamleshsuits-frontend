const { chromium } = require('C:/Users/Deepak/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const results = [];
const product = { suitId: 'audit-suit', title: 'Audit Cotton Suit', price: 1050, mrp: 1200, stock: 6, product_category: 'suits', fabric_category: 'Cotton', image: '/icons/pwa-512.png', images: ['/icons/pwa-512.png'], colors: ['Rose', 'Blue'], variants: [{ id: 'rose', colorName: 'Rose', stock: 3, images: ['/icons/pwa-512.png'] }, { id: 'blue', colorName: 'Blue', stock: 3, images: ['/icons/pwa-192.png'] }] };
const address = { id: 1, name: 'QA Test', phone: '9999999999', pincode: '122504', houseNo: 'TEST ONLY', area: 'Khandewla', city: 'Gurugram', state: 'Haryana' };
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block', geolocation: { latitude: 28.3839, longitude: 76.7695 }, permissions: ['geolocation'] });
  const page = await context.newPage();
  page.setDefaultTimeout(7000);
  page.setDefaultNavigationTimeout(25000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let orderBody;
  let zooms = [];
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1') return route.continue();
    let data = {};
    if (url.hostname.includes('nominatim')) { zooms.push(url.searchParams.get('zoom')); data = { address: { country_code: 'in', village: 'Khandewla', state: 'Haryana', ...(url.searchParams.get('zoom') === '10' ? { postcode: '122504' } : {}) } }; }
    else if (url.hostname.includes('postalpincode')) data = [{ Status: 'Success', PostOffice: [{ District: 'Gurugram', State: 'Haryana', Name: 'Khandewla' }] }];
    else if (url.pathname === '/api/products') data = [product];
    else if (url.pathname === '/api/products/audit-suit') data = product;
    else if (url.pathname.startsWith('/api/products/')) return route.fulfill({ status: 404, json: { message: 'Product not found' } });
    else if (url.pathname.includes('delivery/validate')) data = { isAllowed: true, deliveryFee: 60 };
    else if (url.pathname === '/api/orders') { orderBody = route.request().postDataJSON(); data = { orderId: 'QA-MOCK-ORDER', trackingToken: 'mock-token' }; }
    else if (url.pathname.includes('hero')) data = [{ image: product.image, alt_text: 'Rose suit', product_path: '/product/audit-suit' }, { image: '/icons/pwa-192.png', alt_text: 'Blue suit', product_path: '/product/audit-suit' }];
    else if (url.pathname.includes('taxonomy')) data = { categories: [{ id: 'suits', label: 'Suits', subcategories: [] }] };
    else if (url.pathname.includes('banners') || url.pathname.includes('coupons') || url.pathname.includes('lookup-by-phone')) data = [];
    return route.fulfill({ json: data });
  });
  await context.addInitScript(() => { sessionStorage.setItem('hasSeenLaunch', 'true'); sessionStorage.setItem('kamlesh_location_prompt_seen', 'true'); sessionStorage.setItem('kamlesh_notification_prompt_seen', 'true'); });
  async function test(name, fn) { try { await fn(); results.push({ name, status: 'PASS' }); } catch (e) { results.push({ name, status: 'FAIL', error: e.message.slice(0, 700) }); } }
  await test('Home and mobile category active state', async () => { await page.goto('http://127.0.0.1:5174/'); await page.getByRole('button', { name: 'All Products', exact: true }).waitFor(); assert.equal(await page.getByRole('button', { name: 'All Products', exact: true }).getAttribute('aria-pressed'), 'true'); });
  await test('Product page, colour selection and Order Now', async () => { await page.goto('http://127.0.0.1:5174/product/audit-suit'); await page.getByRole('button', { name: 'Select Blue', exact: true }).first().click(); await page.getByRole('button', { name: 'Order Now', exact: true }).click(); await page.waitForURL('**/cart'); const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('cartItems'))); assert.equal(cart[0].selectedColor, 'Blue'); });
  await test('Checkout tax inclusive price and mocked order submission', async () => {
    await page.evaluate(a => localStorage.setItem('addresses', JSON.stringify([a])), address);
    await page.reload();
    await page.getByText('TEST ONLY', { exact: false }).first().click();
    await page.waitForTimeout(500);
    const buttons = await page.getByRole('button').allTextContents(); console.log('CART_BUTTONS', JSON.stringify(buttons));
    const submit = page.getByRole('button', { name: /place order|confirm order|request order/i });
    await submit.click();
    await page.waitForTimeout(500);
    assert.ok(orderBody, 'Order request captured'); assert.equal(orderBody.total, 1110); assert.equal(orderBody.items[0].selectedColor, 'Blue');
  });
  await test('Location recovers PIN from locality after building omits it', async () => {
    await page.goto('http://127.0.0.1:5174/');
    await page.getByText('Select your location for better insights').first().click();
    await page.getByRole('button', { name: 'Allow location access' }).click();
    await page.getByText('Delivery is available in your area').waitFor();
    assert.ok(zooms.includes('18') && zooms.includes('10'));
    const loc = await page.evaluate(() => JSON.parse(localStorage.getItem('deliveryLocation'))); assert.equal(loc.pincode, '122504');
    await page.getByRole('button', { name: 'Continue shopping', exact: true }).click();
  });
  await test('Missing product recovers with an error instead of endless loader', async () => { await page.goto('http://127.0.0.1:5174/product/missing'); await page.getByRole('alert').filter({ hasText: 'no longer available' }).waitFor(); await page.getByRole('button', { name: 'Browse products', exact: true }).click(); await page.waitForURL('http://127.0.0.1:5174/'); });
  await test('Product swipe selects next colour and does not open lightbox', async () => {
    await page.goto('http://127.0.0.1:5174/product/audit-suit');
    const surface = page.locator('[style*="touch-action"]').first();
    await surface.waitFor();
    await surface.evaluate(el => {
      const start = new Touch({ identifier: 1, target: el, clientX: 300, clientY: 200 });
      const end = new Touch({ identifier: 1, target: el, clientX: 100, clientY: 200 });
      el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [start] }));
      el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, changedTouches: [end] }));
    });
    assert.equal(await page.getByRole('button', { name: 'Select Blue', exact: true }).first().getAttribute('aria-pressed'), 'true');
  });
  await test('Wishlist saves a product across navigation', async () => { await page.getByRole('button', { name: 'Add to Wishlist', exact: true }).click(); await page.goto('http://127.0.0.1:5174/wishlist'); await page.getByText('Audit Cotton Suit', { exact: true }).first().waitFor(); });
  await test('Invalid tracking phone is rejected', async () => { await page.goto('http://127.0.0.1:5174/track-order'); await page.getByRole('textbox', { name: 'Mobile number' }).fill('123'); await page.getByRole('button', { name: 'Find Orders' }).click(); await page.getByRole('alert').filter({ hasText: '10-digit' }).waitFor(); });
  await test('Denied delivery cannot submit; failed lookup exposes retry', async () => {
    await context.route('**/api/delivery/validate/**', route => route.fulfill({ status: 503, json: { message: 'Unavailable' } }));
    await page.evaluate(({product, address}) => { localStorage.setItem('cartItems', JSON.stringify([{...product, quantity: 1}])); localStorage.setItem('addresses', JSON.stringify([address])); }, {product,address});
    await page.goto('http://127.0.0.1:5174/cart'); await page.getByText('TEST ONLY', { exact: false }).first().click();
    await page.getByRole('button', { name: 'Retry delivery check' }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Delivery Not Available' }).isDisabled(), true);
    await context.unroute('**/api/delivery/validate/**');
    await page.getByRole('button', { name: 'Retry delivery check' }).click();
    await page.getByRole('button', { name: 'Place Order Request' }).waitFor();
  });
  await test('Location denial opens manual PIN without IP lookup', async () => {
    await context.clearPermissions();
    await page.goto('http://127.0.0.1:5174/');
    await page.getByText('Delivering to', { exact: false }).first().click();
    await page.getByRole('button', { name: 'Allow location access' }).click();
    await page.getByRole('alert').filter({ hasText: 'blocked' }).waitFor();
    await page.getByRole('textbox', { name: 'Delivery PIN code' }).fill('122504');
    await page.getByRole('button', { name: 'Check', exact: true }).click();
    await page.getByText('Delivery is available in your area').waitFor();
  });
  for (const path of ['/new-arrivals', '/sale', '/wishlist', '/track-order', '/login', '/signup', '/terms', '/does-not-exist', '/account', '/admin']) {
    await test(`Mobile route and overflow: ${path}`, async () => { await page.goto(`http://127.0.0.1:5174${path}`); await page.waitForTimeout(800); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true); assert.ok((await page.locator('body').innerText()).length > 30); });
  }
  for (const width of [320, 360, 430]) await test(`Small-screen layout ${width}px`, async () => { await page.setViewportSize({width, height:844}); await page.goto('http://127.0.0.1:5174/product/audit-suit'); await page.getByRole('button', {name:'Order Now',exact:true}).waitFor(); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true); });
  results.push({ name: 'Uncaught browser exceptions', status: errors.length ? 'FAIL' : 'PASS', errors });
  fs.mkdirSync('audit-results', { recursive: true });
  await page.screenshot({ path: 'audit-results/mobile-final.png', fullPage: true });
  fs.writeFileSync('audit-results/mobile.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exitCode = 1; });
