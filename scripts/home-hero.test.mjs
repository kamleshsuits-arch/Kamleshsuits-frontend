import assert from 'node:assert/strict';
import { describeHeroCoupon, selectHeroSuits, selectLatestCoupon } from '../src/utils/homeHero.js';

const suit = (id, overrides = {}) => ({ suitId: id, title: id, product_category: 'suits', price: 901, stock: 1, images: [`https://example.com/${id}.jpg`], created_at: '2026-09-01', ...overrides });
const products = [
  suit('old'), suit('latest', { created_at: '2026-09-15' }),
  suit('threshold', { price: 900 }), suit('cheap', { price: 899 }),
  suit('bedsheet', { product_category: 'bed-khat-sheets', price: 1500 }),
  suit('sold-out', { stock: 0 }), suit('hidden', { active: false }),
  suit('invalid', { price: 'NaN' }), suit('no-image', { images: [] }),
  suit('legacy', { product_category: undefined, images: '["https://example.com/legacy.jpg"]' }),
  suit('latest', { created_at: '2026-09-15' }),
];
const originalOrder = products.map(product => product.suitId);
assert.deepEqual(selectHeroSuits(products).map(item => item.alt), ['latest', 'legacy', 'old']);
assert.deepEqual(products.map(product => product.suitId), originalOrder);
assert.equal(selectHeroSuits(products)[0].productPath, '/product/latest');
assert.equal(selectHeroSuits(Array.from({ length: 12 }, (_, i) => suit(`suit-${i}`))).length, 6);
assert.deepEqual(selectHeroSuits(null), []);

const now = Date.parse('2026-09-17T12:00:00Z');
const coupon = (code, overrides = {}) => ({ code, discount: 500, discount_type: 'flat', created_at: '2026-09-01', ...overrides });
const offers = [
  coupon('OLD'), coupon('LATEST', { created_at: '2026-09-15', min_purchase: 3999 }),
  coupon('EXPIRED', { created_at: '2026-09-17', expires_at: '2026-09-16' }),
  coupon('EXHAUSTED', { created_at: '2026-09-17', usage_limit: 5, used_count: 5 }),
  coupon('INVALID-DATE', { expires_at: 'invalid' }),
  coupon('FUTURE', { starts_at: '2026-10-01' }), coupon('DISABLED', { active: false }),
];
assert.equal(selectLatestCoupon(offers, now).code, 'LATEST');
assert.equal(selectLatestCoupon(offers.slice(2), now), null);
assert.equal(selectLatestCoupon([], now), null);
assert.equal(selectLatestCoupon(null, now), null);
assert.equal(selectLatestCoupon([coupon('EXPIRING', { expires_at: new Date(now).toISOString() })], now), null);
assert.deepEqual(describeHeroCoupon(offers[1]), { title: '₹500 off · Use LATEST', detail: 'All products · Min. purchase ₹3,999' });
assert.deepEqual(describeHeroCoupon(coupon('SUITS10', { discount: 10, discount_type: 'percent', category_ids: ['suits'] })), { title: '10% off · Use SUITS10', detail: 'Suits · No minimum purchase' });
console.log('Hero selection and coupon eligibility checks passed.');
