const { chromium } = require('C:/Users/Deepak/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const colors = ['Navy Blue', 'Cream', 'Maroon', 'Pink', 'Emerald Green', 'Black', 'Lavender', 'Mustard', 'Rust', 'White', 'Custom Rose'];
const products = colors.map((color, index) => ({ suitId: `filter-${index}`, title: `${color} Cotton Suit`, price: (index + 1) * 500, mrp: (index + 1) * 600, discount: index * 5, rating: index % 5, created_at: `2026-09-${String(index + 1).padStart(2, '0')}`, stock: 5, product_category: 'suits', categories: [index % 2 ? 'Casual' : 'Festive'], images: ['/icons/pwa-512.png'], image: '/icons/pwa-512.png', colors: index === 10 ? [] : [color], variants: index === 10 ? [{ colorName: color, colorHex: '#ba617b', stock: 5 }] : [] }));
products.push({ ...products[0], suitId: 'duplicate-navy', title: 'Second Navy Suit', colors: [' navy blue '], price: 250 });
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  await context.addInitScript(() => { sessionStorage.setItem('hasSeenLaunch', 'true'); sessionStorage.setItem('kamlesh_location_prompt_seen', 'true'); sessionStorage.setItem('kamlesh_notification_prompt_seen', 'true'); });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1') return route.continue();
    let data = {};
    if (url.pathname === '/api/products') data = products;
    else if (url.pathname.includes('taxonomy')) data = { categories: [{ id: 'suits', label: 'Suits', subcategories: [] }] };
    else if (/banners|coupons|hero/.test(url.pathname)) data = [];
    return route.fulfill({ json: data });
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const results = [];
  async function check(name, callback) { await callback(); results.push(name); console.log('PASS', name); }
  await page.goto('http://127.0.0.1:5174/product');
  await page.getByRole('heading', { name: /Collection/ }).waitFor();
  const filterButton = page.getByRole('button', { name: /^Filters/ });
  const sheet = page.getByRole('dialog', { name: 'Filters', exact: true });
  await check('Product route displays mobile controls', async () => { assert.ok(await filterButton.isVisible()); assert.ok(await page.getByRole('button', { name: 'Sort by: Featured' }).isVisible()); });
  fs.mkdirSync('audit-results', { recursive: true });
  await page.screenshot({ path: 'audit-results/collection-mobile.png' });
  await filterButton.click();
  await check('Filter sheet is modal and locks background scrolling', async () => { assert.ok(await sheet.evaluate(el => el.matches(':modal'))); assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden'); });
  await check('Normalized colors match multiple products', async () => {
    await sheet.getByRole('textbox', { name: 'Search colors' }).or(sheet.getByRole('searchbox', { name: 'Search colors' })).fill('navy');
    assert.equal(await sheet.getByRole('button', { name: 'Navy Blue', exact: true }).count(), 1);
    await sheet.getByRole('button', { name: 'Navy Blue', exact: true }).click();
    assert.equal(await sheet.getByRole('button', { name: 'Navy Blue', exact: true }).getAttribute('aria-pressed'), 'true');
    await sheet.getByRole('button', { name: 'Show 2 products', exact: true }).waitFor();
    await sheet.getByRole('button', { name: 'Clear all', exact: true }).click();
    await sheet.getByRole('searchbox', { name: 'Search colors' }).fill('');
  });
  await check('Custom variant color uses its hex and filters correctly', async () => {
    const custom = sheet.getByRole('button', { name: 'Custom Rose', exact: true });
    assert.equal(await custom.locator('span').first().evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(186, 97, 123)');
    await custom.click();
    await sheet.getByRole('button', { name: 'Show 1 product', exact: true }).waitFor();
    await custom.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'audit-results/collection-colors.png' });
    await sheet.getByRole('button', { name: 'Clear all', exact: true }).click();
  });
  await check('Price bounds reset and report invalid ranges', async () => {
    await sheet.getByRole('spinbutton', { name: 'Maximum price' }).fill('700');
    await sheet.getByRole('button', { name: 'Show 2 products', exact: true }).waitFor();
    await sheet.getByRole('spinbutton', { name: 'Maximum price' }).fill('');
    await sheet.getByRole('button', { name: 'Show 12 products', exact: true }).waitFor();
    await sheet.getByRole('spinbutton', { name: 'Minimum price' }).fill('1000');
    await sheet.getByRole('spinbutton', { name: 'Maximum price' }).fill('500');
    await sheet.getByRole('alert').waitFor();
    await sheet.getByRole('button', { name: 'Clear all', exact: true }).click();
  });
  await check('Escape dismisses sheet and returns focus', async () => { await page.keyboard.press('Escape'); assert.equal(await sheet.count(), 0); assert.equal(await filterButton.evaluate(el => el === document.activeElement), true); assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden'); });
  await page.getByRole('button', { name: 'Sort by: Featured' }).click();
  await page.screenshot({ path: 'audit-results/collection-sort.png' });
  await page.getByRole('button', { name: 'Price: High to low', exact: true }).click();
  await check('Sort orders products and stays selected after clearing filters', async () => {
    await page.getByRole('button', { name: 'Sort by: Price: High to low' }).waitFor();
    const titles = await page.locator('h3').allTextContents();
    assert.ok(titles.indexOf('Custom Rose Cotton Suit') < titles.indexOf('Navy Blue Cotton Suit'));
    await filterButton.click();
    await sheet.getByRole('checkbox', { name: 'Suits', exact: true }).check();
    await sheet.getByRole('button', { name: 'Clear all', exact: true }).click();
    await sheet.getByRole('button', { name: 'Show 12 products', exact: true }).click();
    assert.ok(await page.getByRole('button', { name: 'Sort by: Price: High to low' }).isVisible());
  });
  for (const width of [320, 390, 768]) await check(`No overflow and reachable sheet footer at ${width}px`, async () => {
    await page.setViewportSize({ width, height: 700 });
    await filterButton.click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const button = await sheet.getByRole('button', { name: 'Show 12 products', exact: true }).boundingBox();
    assert.ok(button.y >= 0 && button.y + button.height <= 700);
    await sheet.getByRole('button', { name: 'Close filters', exact: true }).click();
  });
  await check('Desktop resize closes sheet and desktop controls remain functional', async () => {
    await filterButton.click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await sheet.waitFor({ state: 'detached' });
    assert.equal(await filterButton.isVisible(), false);
    await page.getByRole('combobox', { name: 'Sort by', exact: true }).selectOption('price_asc');
    await page.getByRole('button', { name: 'Navy Blue', exact: true }).click();
    await page.getByRole('heading', { name: 'Collection (2 items)' }).waitFor();
    await page.screenshot({ path: 'audit-results/collection-desktop.png' });
  });
  await check('No uncaught browser errors', async () => assert.deepEqual(errors, []));
  fs.writeFileSync('audit-results/collection-filters.json', JSON.stringify({ passed: results, errors }, null, 2));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
