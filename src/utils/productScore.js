// Generated display scores are kept separate from customer review data.
export function getProductScore(product = {}) {
  const raw = Number(product.rating);
  const rating = raw > 5 && raw <= 10 ? raw / 2 : raw;
  const reviews = Number(product.reviews);
  if (Number.isFinite(rating) && rating >= 1 && rating <= 5 && Number.isInteger(reviews) && reviews > 0) {
    return { value: rating.toFixed(1), kind: 'customer', reviews };
  }

  // Stable across refreshes, sorting and pages; no random scores on each render.
  const identity = String(product.suitId || product.id || product.title || 'collection');
  let hash = 2166136261;
  for (const character of identity) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0;
  }
  return { value: ((40 + hash % 9) / 10).toFixed(1), kind: 'style', reviews: 0 };
}
