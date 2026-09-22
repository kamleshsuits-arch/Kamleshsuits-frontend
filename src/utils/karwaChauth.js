import { selectLatestCoupon } from './homeHero.js';

export const KARWA_COUPON_CODE = 'KARWA10';
const redColour = value => /\b(red|crimson|maroon|ruby|burgundy|wine|scarlet)\b/i.test(String(value || '').split(/\s*(?:&|,|\band\b)\s*/i)[0]);
const newest = product => Date.parse(product.created_at) || 0;
const festivalDesign = product => (product.categories || []).some(category => /karwa|karva/i.test(category));

// Pick the actual red variant photo, not a different colour's cover photograph.
export const selectKarwaChauthSuits = (products, maxPrice = Infinity) => {
  const seen = new Set();
  return (Array.isArray(products) ? products : [])
    .filter(product => product?.suitId && (product.product_category || 'suits') === 'suits'
      && product.active !== false && Number(product.stock) > 0
      && Number(product.price) > 0 && Number(product.price) <= maxPrice)
    .map(product => {
      const variants = Array.isArray(product.variants) ? product.variants : [];
      const redVariant = variants.find(variant => Number(variant.stock) > 0 && redColour(variant.colorName) && variant.images?.length);
      const primaryRed = !variants.length && (product.colors || []).some(redColour);
      const image = redVariant?.images[0] || product.image || (Array.isArray(product.images) ? product.images[0] : '');
      return { ...product, festivalImage: image, festivalRed: Boolean(redVariant || primaryRed) };
    })
    .filter(product => {
      if (!product.festivalImage || seen.has(product.suitId)) return false;
      seen.add(product.suitId);
      return true;
    })
    .sort((a, b) => Number(b.festivalRed) - Number(a.festivalRed)
      || Number(festivalDesign(b)) - Number(festivalDesign(a))
      || newest(b) - newest(a) || a.suitId.localeCompare(b.suitId));
};

export const selectKarwaCoupon = (coupons, now) => selectLatestCoupon(
  (Array.isArray(coupons) ? coupons : []).filter(coupon => coupon.code === KARWA_COUPON_CODE
    && coupon.discount_type === 'percent' && Number(coupon.discount) === 10
    && Number(coupon.min_purchase) === 3000 && !coupon.category_ids?.length), now);
