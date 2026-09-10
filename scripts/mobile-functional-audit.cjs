const { chromium } = require('C:/Users/Deepak/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');

const baseUrl = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:5174';
const product = {
  suitId: 'functional-suit', title: 'Functional Cotton Suit', price: 1050, mrp: 1200,
  stock: 6, product_category: 'suits', image: '/icons/pwa-512.png',
  images: ['/icons/pwa-512.png'], colors: ['Rose'],
};
const address = {
  id: 1, name: 'QA Customer', phone: '9999999999', pincode: '122504', houseNo: 'Test House',
  area: 'Khandewla', city: 'Gurugram', state: 'Haryana', type: 'home',
};
const coupon = {
  code: 'SAVE10', description: 'QA discount', discount_type: 'percent', discount: 10,
  min_purchase: 500, category_ids: [], created_at: '2026-09-09T00:00:00.000Z',
};

(async () => {
  const results = [];
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  page.setDefaultNavigationTimeout(30000);
  let orderBody;

  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === baseUrl) return route.continue();
    if (url.hostname.includes('postalpincode')) {
      return route.fulfill({ json: [{ Status: 'Success', PostOffice: [{ District: 'Gurugram', State: 'Haryana', Name: 'Khandewla' }] }] });
    }
    if (url.pathname === '/api/products') return route.fulfill({ json: [product] });
    if (url.pathname === '/api/products/functional-suit') return route.fulfill({ json: product });
    if (url.pathname === '/api/coupons' && route.request().method() === 'GET') return route.fulfill({ json: [coupon] });
    if (url.pathname === '/api/coupons/validate') return route.fulfill({ json: { ...coupon, eligible_subtotal: 1050 } });
    if (url.pathname.includes('/api/delivery/validate/')) return route.fulfill({ json: { isAllowed: true, deliveryFee: 60 } });
    if (url.pathname === '/api/orders') {
      orderBody = route.request().postDataJSON();
      return route.fulfill({ json: { orderId: 'QA-FUNCTIONAL', trackingToken: 'qa-token' } });
    }
    if (url.pathname.includes('taxonomy')) return route.fulfill({ json: { categories: [{ id: 'suits', label: 'Suits', subcategories: [] }] } });
    if (url.pathname.includes('hero') || url.pathname.includes('banners') || url.pathname.includes('lookup-by-phone')) return route.fulfill({ json: [] });
    return route.fulfill({ json: {} });
  });

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
      results.push({ name, status: 'FAIL', error: error.message.slice(0, 700) });
    }
  }

  const seedCart = async (quantity = 1, seededAddresses = []) => {
    await page.goto(baseUrl);
    await page.getByRole('button', { name: 'All Products', exact: true }).waitFor();
    await page.waitForTimeout(500);
    await page.evaluate(({ item, quantity, addresses }) => {
      localStorage.setItem('cartItems', JSON.stringify([{ ...item, quantity }]));
      localStorage.setItem('addresses', JSON.stringify(addresses));
      localStorage.removeItem('wishlistItems');
      window.location.assign('/cart');
    }, { item: product, quantity, addresses: seededAddresses });
    await page.waitForURL(`${baseUrl}/cart`);
  };

  await test('Cart quantity is capped at two and persists', async () => {
    await seedCart();
    const increase = page.getByRole('button', { name: `Increase quantity of ${product.title}` });
    await increase.click();
    assert.equal(await increase.isDisabled(), true);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('cartItems')));
    assert.equal(stored[0].quantity, 2);
  });

  await test('Manual address can be added, edited and removed', async () => {
    await seedCart();
    await page.getByRole('button', { name: /Add New Address/i }).click();
    await page.getByLabel('Full Name *').fill('QA Address');
    await page.getByLabel('Phone Number *').fill('9999999999');
    await page.getByRole('button', { name: 'No, enter manually' }).click();
    await page.getByLabel('Pincode *').fill('122504');
    await page.getByLabel('Flat, House no., Building, Apartment *').fill('House 10');
    await page.getByLabel('Area, Street, Sector, Village *').fill('Khandewla');
    await page.getByLabel('Town/City *').fill('Gurugram');
    await page.getByLabel('State *').fill('Haryana');
    await page.getByRole('button', { name: 'Deliver to this Address' }).click();
    await page.getByText('QA Address', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Edit address for QA Address' }).click();
    await page.getByLabel('Full Name *').fill('QA Address Updated');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await page.getByText('QA Address Updated', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Remove address for QA Address Updated' }).click();
    await page.getByText('No addresses saved yet', { exact: true }).waitFor();
  });

  await test('Eligible coupon changes the submitted total', async () => {
    orderBody = undefined;
    await seedCart(1, [address]);
    await page.getByText('Test House', { exact: false }).first().click();
    const couponButton = page.getByRole('button').filter({ hasText: 'SAVE10' }).last();
    await couponButton.click();
    await page.getByText('Coupon Applied', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Place Order Request' }).click();
    await page.waitForTimeout(300);
    assert.ok(orderBody, 'Order request was not submitted');
    assert.equal(orderBody.total, 1005);
  });

  await test('Rejected coupon shows an error and preserves the full total', async () => {
    await seedCart(1, [address]);
    await context.route('**/api/coupons/validate', route => route.fulfill({ status: 400, json: { message: 'Coupon has expired' } }));
    await page.getByText('Test House', { exact: false }).first().click();
    await page.getByRole('button', { name: 'Apply coupon SAVE10' }).click();
    await page.getByText('Warning: Coupon has expired', { exact: true }).waitFor();
    orderBody = undefined;
    await page.getByRole('button', { name: 'Place Order Request' }).click();
    await page.waitForFunction(() => document.body.innerText.includes('QA-FUNCTIONAL'));
    assert.equal(orderBody.total, 1110);
    await context.unroute('**/api/coupons/validate');
  });

  await test('Wishlist item can be removed', async () => {
    await page.goto(`${baseUrl}/product/functional-suit`);
    await page.getByRole('button', { name: 'Add to Wishlist', exact: true }).click();
    await page.goto(`${baseUrl}/wishlist`);
    await page.getByText(product.title, { exact: true }).first().waitFor();
    await page.getByRole('button', { name: `Remove ${product.title} from wishlist` }).first().click();
    await page.getByText('Your wishlist is empty').waitFor();
  });

  fs.mkdirSync('audit-results', { recursive: true });
  fs.writeFileSync('audit-results/mobile-functional.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
  if (results.some(result => result.status === 'FAIL')) process.exitCode = 1;
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
