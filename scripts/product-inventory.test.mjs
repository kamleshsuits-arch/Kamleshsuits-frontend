import assert from 'node:assert/strict';
import test from 'node:test';
import { cartQuantityLimit, getColourStock, imageColour } from '../src/utils/productInventory.js';
import { productMetadata } from '../src/utils/socialMetadata.js';

const variants = [
  { colorName: 'Mustard Gold', stock: 1, images: ['model.jpg', 'palette.jpg'] },
  { colorName: 'Red', stock: 0, images: ['palette.jpg'] },
];
test('all colour choices use one design stock, including sold out designs', () => {
  const product = { inventory_mode: 'shared', stock: 1, variants };
  for (const variant of variants) assert.equal(getColourStock(product, variant), 1);
  assert.equal(cartQuantityLimit(product), 1);
  const soldOut = { ...product, stock: 0 };
  assert.equal(getColourStock(soldOut, variants[0]), 0);
  assert.equal(cartQuantityLimit(soldOut), 0);
  assert.equal(productMetadata(soldOut).availability, 'out of stock');
});
test('existing independent colour inventory is preserved', () => {
  const product = { stock: 1, variants };
  assert.equal(getColourStock(product, variants[1]), 0);
  assert.equal(cartQuantityLimit(product), 2);
});
test('shared photos preserve selected colour; dedicated photos identify their colour', () => {
  assert.equal(imageColour(variants, 'palette.jpg'), undefined);
  assert.equal(imageColour(variants, 'model.jpg'), 'Mustard Gold');
});
