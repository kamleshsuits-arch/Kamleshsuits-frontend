import assert from 'node:assert/strict';
import { selectKarwaChauthSuits, selectKarwaCoupon } from '../src/utils/karwaChauth.js';
import { selectHeroSuits } from '../src/utils/homeHero.js';

const suit = (suitId, color, overrides = {}) => ({ suitId, title: suitId, product_category: 'suits', stock: 1, price: 1200, created_at: '2026-09-01', image: '/primary.jpg', colors: [color], ...overrides });
const products = [
  suit('green', 'Green', { created_at: '2026-09-25' }),
  suit('crimson', 'Crimson Red', { created_at: '2026-09-22', price: 2399 }),
  suit('multi', 'Green', { variants: [{ colorName: 'Green', stock: 1, images: ['/green.jpg'] }, { colorName: 'Ruby Red', stock: 1, images: ['/red.jpg'] }] }),
  suit('sold-red', 'Red', { stock: 0 }),
  suit('red-sheet', 'Red', { product_category: 'bed-khat-sheets' }),
  suit('sold-variant', 'Red', { variants: [{ colorName: 'Red', stock: 0, images: ['/sold.jpg'] }, { colorName: 'Blue', stock: 1, images: ['/blue.jpg'] }] }),
];
const selected = selectKarwaChauthSuits(products);
assert.deepEqual(selected.map(p => p.suitId), ['crimson', 'multi', 'green', 'sold-variant']);
assert.equal(selected[1].festivalImage, '/red.jpg');
assert.equal(selected[3].festivalRed, false);
assert.equal(selectHeroSuits(selected, { preserveOrder: true })[0].productPath, '/product/crimson');
assert.equal(selectHeroSuits(selected, { preserveOrder: true })[1].src, '/red.jpg');
assert.equal(selectHeroSuits(products)[0].productPath, '/product/green');
assert.equal(selectKarwaChauthSuits(products, 2000).some(p => p.suitId === 'crimson'), false);
assert.equal(selectKarwaChauthSuits([...products, products[0]]).length, 4);
assert.deepEqual(selectKarwaChauthSuits(null), []);
assert.equal(selectKarwaChauthSuits([suit('taupe', 'Taupe & Maroon')])[0].festivalRed, false);
assert.equal(selectKarwaChauthSuits([suit('old-festival', 'Red', { categories: ['Karwa Chauth'] }), suit('new-red', 'Red', { created_at: '2026-09-23' })])[0].suitId, 'old-festival');
const offer = { code: 'KARWA10', discount: 10, discount_type: 'percent', min_purchase: 3000, category_ids: [] };
assert.equal(selectKarwaCoupon([offer]).code, 'KARWA10');
for (const change of [{ min_purchase: 5000 }, { discount: 5 }, { category_ids: ['suits'] }, { active: false }, { expires_at: '2020-01-01' }, { usage_limit: 1, used_count: 1 }]) {
  assert.equal(selectKarwaCoupon([{ ...offer, ...change }]), null);
}
console.log('Karwa Chauth selection, variant images, price bands and coupon eligibility passed.');
