import assert from 'node:assert/strict';
import { getProductScore } from '../src/utils/productScore.js';

const scores = Array.from({ length: 100 }, (_, index) => {
  const product = { suitId: `suit-${index}`, rating: 0, reviews: 0 };
  const score = getProductScore(product);
  assert.equal(score.kind, 'style');
  assert.equal(score.reviews, 0);
  assert.ok(Number(score.value) >= 4 && Number(score.value) <= 4.8);
  assert.deepEqual(getProductScore({ ...product, price: 2500, title: 'Updated title' }), score);
  return score.value;
});
assert.equal(new Set(scores).size, 9);
assert.deepEqual(getProductScore({ rating: 3.6, reviews: 8 }), { value: '3.6', kind: 'customer', reviews: 8 });
assert.deepEqual(getProductScore({ rating: 4.9, reviews: 12 }), { value: '4.9', kind: 'customer', reviews: 12 });
assert.deepEqual(getProductScore({ rating: 8.6, reviews: 3 }), { value: '4.3', kind: 'customer', reviews: 3 });
for (const product of [{}, { rating: 'bad', reviews: 3 }, { rating: 4.5, reviews: 0 }, { rating: 4.5, reviews: -1 }]) {
  assert.equal(getProductScore(product).kind, 'style');
}
console.log('Scores cover 4.0–4.8, remain stable, and preserve recorded customer ratings without inventing review counts.');
