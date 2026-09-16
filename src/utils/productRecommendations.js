import { DEFAULT_PRODUCT_CATEGORY } from './productTaxonomy.js';
import { getColorDisplay } from './colors.js';

const normalize = value => typeof value === 'string' ? value.trim().toLowerCase().replace(/\s+/g, ' ') : '';
const list = value => Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
const idOf = product => product?.suitId == null ? '' : String(product.suitId);
const categoryOf = product => normalize(product.product_category) || DEFAULT_PRODUCT_CATEGORY;
const tokens = values => new Set(values.map(normalize).filter(value => value && !['product', 'general', 'n/a', 'none'].includes(value)));
const styleOf = product => tokens([product.product_subcategory, product.type, product.fabric_family, product.fabric_category]);
const colorsOf = (product, selectedColor) => new Set((normalize(selectedColor) ? [selectedColor] : [
  ...list(product.colors), product.color,
  ...(Array.isArray(product.variants) ? product.variants.map(variant => variant?.colorName) : []),
]).map(normalize).filter(Boolean).map(color => normalize(getColorDisplay(color))));
const overlap = (reference, candidate) => reference.size
  ? [...reference].filter(value => candidate.has(value)).length / reference.size : 0;
const priceOf = product => {
  if (product.price == null || String(product.price).trim() === '') return null;
  const price = Number(product.price);
  return Number.isFinite(price) && price >= 0 ? price : null;
};
const sheetType = product => normalize(product.product_subcategory).replace(/[\s-]+/g, '').replace(/s$/, '');

// Category is a hard boundary. Never pad a small collection with unrelated items.
export const getRelatedProducts = (currentProduct, allProducts, { selectedColor = '', limit = 8 } = {}) => {
  if (!Array.isArray(allProducts)) return [];
  const count = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 8;
  const currentId = idOf(currentProduct);
  const seen = new Set(currentId ? [currentId] : []);
  const candidates = allProducts.filter(product => {
    const id = idOf(product);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    if (!currentProduct) return true;
    if (categoryOf(product) !== categoryOf(currentProduct)) return false;
    // Bed sheets and khat sheets share a catalogue category, but are different items.
    return categoryOf(currentProduct) !== 'bed-khat-sheets' || !sheetType(currentProduct)
      || sheetType(product) === sheetType(currentProduct);
  });
  // Wishlist has no reference product and keeps its existing catalogue selection.
  if (!currentProduct) return candidates.slice(0, count);

  const referenceColors = colorsOf(currentProduct, selectedColor || currentProduct.selectedColor);
  const referenceStyle = styleOf(currentProduct);
  const referenceOccasions = tokens(list(currentProduct.categories));
  const referencePrice = priceOf(currentProduct);
  return candidates.map(product => {
    const price = priceOf(product);
    const priceGap = price == null || referencePrice == null ? Infinity : Math.abs(price - referencePrice);
    const priceSimilarity = Number.isFinite(priceGap) ? 1 - priceGap / Math.max(price, referencePrice, 1) : 0;
    // Price (40), matching color (30), type/fabric (30), and shared occasion (5).
    // Missing attributes contribute nothing; two empty fields are never a match.
    const score = 40 * priceSimilarity
      + 30 * overlap(referenceColors, colorsOf(product))
      + 30 * overlap(referenceStyle, styleOf(product))
      + 5 * overlap(referenceOccasions, tokens(list(product.categories)));
    return { product, score, priceGap };
  }).sort((a, b) => b.score - a.score || a.priceGap - b.priceGap || idOf(a.product).localeCompare(idOf(b.product)))
    .slice(0, count).map(({ product }) => product);
};
