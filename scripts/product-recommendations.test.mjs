import test from 'node:test';
import assert from 'node:assert/strict';
import { getRelatedProducts } from '../src/utils/productRecommendations.js';

const current = { suitId: 'current', product_category: 'suits', price: 1000, colors: ['Blue'], type: 'product', product_subcategory: 'Stitched Suit', fabric_family: 'Cotton', fabric_category: 'Printed Cotton' };
const suit = (id, fields = {}) => ({ ...current, suitId: id, ...fields });
const ids = items => items.map(item => item.suitId);

test('Only same-category products are eligible, with no unrelated fallback', () => {
  const sheet = suit('sheet', { product_category: 'bed-khat-sheets' });
  assert.deepEqual(ids(getRelatedProducts(current, [current, sheet, suit('similar')])), ['similar']);
  assert.deepEqual(getRelatedProducts(current, [current, sheet]), []);
});

test('Bedsheets are kept separate from khat sheets and other categories', () => {
  const sheet = suit('sheet', { product_category: 'bed-khat-sheets', product_subcategory: 'Bed Sheet' });
  const match = { ...sheet, suitId: 'other-sheet', product_subcategory: ' bed sheets ' };
  const khat = { ...sheet, suitId: 'khat', product_subcategory: 'Khat Sheet' };
  assert.deepEqual(ids(getRelatedProducts(sheet, [current, khat, match])), ['other-sheet']);
  assert.deepEqual(getRelatedProducts(khat, [current, sheet, match]), []);
});

test('Closer prices rank first when colors and type match', () => {
  assert.deepEqual(ids(getRelatedProducts(current, [suit('far', { price: 8000 }), suit('close', { price: '1050' }), suit('middle', { price: 2000 })])), ['close', 'middle', 'far']);
});

test('Matching colors include normalized names, hex values, and variants', () => {
  const blue = { ...current, colors: ' Navy Blue ' };
  const match = suit('variant', { colors: [], variants: [{ colorName: 'navy blue' }] });
  const hex = suit('hex', { colors: ['#000080'] });
  const other = suit('other', { colors: ['Pink'] });
  assert.deepEqual(ids(getRelatedProducts(blue, [other, match, hex])), ['hex', 'variant', 'other']);
});

test('Selecting a different color updates which matching product comes first', () => {
  const candidates = [suit('blue'), suit('pink', { colors: ['Pink'] })];
  assert.equal(getRelatedProducts(current, candidates)[0].suitId, 'blue');
  assert.equal(getRelatedProducts(current, candidates, { selectedColor: 'Pink' })[0].suitId, 'pink');
});

test('Matching fabric and type rank above a different style at the same price/color', () => {
  const different = suit('different', { type: 'Festive', product_subcategory: 'Unstitched Suit', fabric_family: 'Silk', fabric_category: 'Silk' });
  assert.deepEqual(ids(getRelatedProducts(current, [different, suit('same')])), ['same', 'different']);
});

test('Empty or generic metadata cannot create a false match', () => {
  const reference = { suitId: 'current', type: 'product', price: 1000 };
  assert.deepEqual(ids(getRelatedProducts(reference, [
    { suitId: 'far', type: 'product', price: 3000 },
    { suitId: 'close', type: 'Cotton', price: 1100 },
    { suitId: 'blanket', product_category: 'blankets', price: 1000 },
  ])), ['close', 'far']);
});

test('Current product and duplicates are excluded across numeric and string IDs', () => {
  const reference = { ...current, suitId: 42 };
  assert.deepEqual(ids(getRelatedProducts(reference, [suit('42'), suit('other'), suit('other'), null, {}])), ['other']);
});

test('Legacy products without a category remain suits; missing prices are not free', () => {
  const reference = { ...current, product_category: undefined, price: 0 };
  assert.deepEqual(ids(getRelatedProducts(reference, [suit('missing', { price: null }), suit('zero', { price: 0, product_category: undefined })])), ['zero', 'missing']);
});

test('Results are deterministic, limited, and leave catalogue data unchanged', () => {
  const catalogue = [suit('c'), suit('a'), suit('b')];
  const original = structuredClone(catalogue);
  assert.deepEqual(ids(getRelatedProducts(current, catalogue, { limit: 2 })), ['a', 'b']);
  assert.deepEqual(ids(getRelatedProducts(current, [...catalogue].reverse(), { limit: 2 })), ['a', 'b']);
  assert.deepEqual(getRelatedProducts(current, catalogue, { limit: 0 }), []);
  assert.deepEqual(catalogue, original);
});

test('Wishlist keeps its existing catalogue selection and empty data is safe', () => {
  const catalogue = [suit('c'), suit('b', { product_category: 'blankets' }), suit('a')];
  assert.deepEqual(getRelatedProducts(null, catalogue, { limit: 2 }), catalogue.slice(0, 2));
  assert.deepEqual(getRelatedProducts(current, null), []);
  assert.deepEqual(getRelatedProducts(current, {}), []);
});
