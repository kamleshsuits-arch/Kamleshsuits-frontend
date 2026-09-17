import { DEFAULT_PRODUCT_CATEGORY, FALLBACK_PRODUCT_TAXONOMY } from './productTaxonomy.js';
import { formatPrice } from './currency.js';

const timestamp = value => Date.parse(value) || 0;
const firstImage = product => {
  let images = product.images;
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch { images = images.split(','); }
  }
  return (Array.isArray(images) ? images.find(image => typeof image === 'string' && image.trim()) : images)
    || product.image || '';
};

export const selectHeroSuits = products => {
  const seen = new Set();
  return (Array.isArray(products) ? products : [])
    .filter(product => product?.suitId
      && (product.product_category || DEFAULT_PRODUCT_CATEGORY) === 'suits'
      && Number.isFinite(Number(product.price)) && Number(product.price) > 900
      && product.active !== false && (product.stock == null || Number(product.stock) > 0)
      && typeof firstImage(product) === 'string' && firstImage(product).trim())
    .sort((a, b) => timestamp(b.created_at) - timestamp(a.created_at)
      || String(a.suitId).localeCompare(String(b.suitId)))
    .filter(product => {
      if (seen.has(product.suitId)) return false;
      seen.add(product.suitId);
      return true;
    })
    .slice(0, 6)
    .map(product => ({
      src: firstImage(product).trim(),
      alt: product.title || 'Featured suit',
      lineOne: `Latest suits · ${formatPrice(product.price)}`,
      lineTwo: product.title || 'Explore this suit',
      lineOneColor: '#FDE68A',
      lineTwoColor: '#FFFFFF',
      productPath: `/product/${encodeURIComponent(product.suitId)}`,
    }));
};

export const selectLatestCoupon = (coupons, now = Date.now()) => (Array.isArray(coupons) ? coupons : [])
  .filter(coupon => coupon?.code?.trim() && coupon.active !== false
    && Number.isFinite(Number(coupon.discount)) && Number(coupon.discount) > 0
    && ['flat', 'percent'].includes(coupon.discount_type)
    && (coupon.discount_type !== 'percent' || Number(coupon.discount) <= 100)
    && (!coupon.expires_at || timestamp(coupon.expires_at) > now)
    && (!coupon.starts_at || timestamp(coupon.starts_at) <= now)
    && (!Number(coupon.usage_limit) || Number(coupon.used_count || 0) < Number(coupon.usage_limit)))
  .sort((a, b) => timestamp(b.created_at) - timestamp(a.created_at)
    || timestamp(b.updated_at) - timestamp(a.updated_at)
    || a.code.localeCompare(b.code))[0] || null;

export const describeHeroCoupon = coupon => {
  const discount = coupon.discount_type === 'percent' ? `${coupon.discount}%` : formatPrice(coupon.discount);
  const categories = Array.isArray(coupon.category_ids) ? coupon.category_ids : [];
  const scope = categories.length
    ? categories.map(id => FALLBACK_PRODUCT_TAXONOMY.find(category => category.id === id)?.label || id).join(', ')
    : 'All products';
  return {
    title: `${discount} off · Use ${coupon.code}`,
    detail: `${scope}${Number(coupon.min_purchase) > 0 ? ` · Min. purchase ${formatPrice(coupon.min_purchase)}` : ' · No minimum purchase'}`,
  };
};
