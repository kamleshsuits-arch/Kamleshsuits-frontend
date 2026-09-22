import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import productPage from '../api/product-page.js';
import ogImage from '../api/og.js';
import { productMetadata, renderSocialMetadata, SOCIAL_IMAGE } from '../src/utils/socialMetadata.js';
import { fetchShareProduct, photoDataUrl } from '../social/catalog.js';

const product = { suitId: 'test-suit', type: 'product', title: 'Red & Gold <Suit>', description: 'Festive red detailing.', price: 2399, discount: 35,
  stock: 1, variants: [{ stock: 1 }], updated_at: '2026-09-22', image: 'https://kamlesh-suits-images.s3.ap-south-1.amazonaws.com/products/test.jpeg' };
const metadata = productMetadata(product);
assert.match(metadata.title, /₹2,399/);
assert.match(metadata.description, /35% off/);
assert.match(metadata.image, /\/api\/og\?product=test-suit&v=2026-09-22/);
assert.equal(productMetadata({ ...product, variants: [{ stock: 0 }] }).availability, 'out of stock');
const malicious = renderSocialMetadata({ ...metadata, title: '"><script>alert(1)</script>' });
assert.ok(!malicious.includes('<script>'));
assert.match(malicious, /&lt;script&gt;/);
const response = () => ({ headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, status(v) { this.statusCode = v; return this; }, send(body) { this.body = body; return this; }, redirect(code, url) { this.statusCode = code; this.location = url; return this; } });
const originalFetch = globalThis.fetch;
const imageBytes = await fs.readFile(new URL('../public/icons/pwa-512.png', import.meta.url));
try {
  globalThis.fetch = async url => String(url).includes('.amazonaws.com')
    ? new Response(imageBytes, { headers: { 'Content-Type': 'image/png' } })
    : new Response(JSON.stringify(product), { headers: { 'Content-Type': 'application/json' } });
  const page = response();
  await productPage({ query: { id: 'test-suit' } }, page);
  assert.equal(page.statusCode, 200);
  assert.equal((page.body.match(/property="og:image"/g) || []).length, 1);
  assert.equal((page.body.match(/name="description"/g) || []).length, 1);
  assert.match(page.body, /<div id="root"><\/div>/);
  assert.match(page.body, /src="\/assets\/index-/);
  assert.match(page.body, /property="og:image:width" content="1200"/);
  assert.match(page.body, /property="product:price:amount" content="2399"/);
  assert.ok(!page.body.includes('window.location.replace'));
  const card = response();
  await ogImage({ query: { product: 'test-suit' } }, card);
  assert.equal(card.statusCode, 200);
  assert.equal(card.headers['content-type'], 'image/png');
  assert.equal(card.body.readUInt32BE(16), 1200);
  assert.equal(card.body.readUInt32BE(20), 630);
  assert.ok(card.body.length < 5 * 1024 * 1024);
  globalThis.fetch = () => { throw new Error('Unexpected network call'); };
  assert.equal(await fetchShareProduct('../private'), null);
  assert.equal(await photoDataUrl({ image: 'https://127.0.0.1/private' }), null);
  globalThis.fetch = async () => new Response('{}', { status: 404 });
  const missing = response();
  await productPage({ query: { id: 'missing' } }, missing);
  assert.equal(missing.statusCode, 404);
  assert.match(missing.body, /noindex, follow/);
  globalThis.fetch = async () => new Response(JSON.stringify({ ...product, type: 'coupon' }));
  assert.equal(await fetchShareProduct('test-suit'), null);
  globalThis.fetch = async () => { throw new Error('Simulated outage'); };
  const outage = response();
  await productPage({ query: { id: 'test-suit' } }, outage);
  assert.equal(outage.statusCode, 503);
  assert.equal(outage.headers['cache-control'], 'no-store');
  const fallback = response();
  await ogImage({ query: { product: 'test-suit' } }, fallback);
  assert.equal(fallback.location, SOCIAL_IMAGE);
  console.log('Passed initial HTML, single OG tags, PNG dimensions, escaping, missing products, outages and image URL restrictions.');
} finally { globalThis.fetch = originalFetch; }
