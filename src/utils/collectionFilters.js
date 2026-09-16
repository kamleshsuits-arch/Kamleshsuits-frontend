import { DEFAULT_PRODUCT_CATEGORY } from './productTaxonomy';
import { getColorDisplay } from './colors';

export const SORT_OPTIONS = [
  { label: 'Featured', value: '' },
  { label: 'Newest first', value: 'newest' },
  { label: 'Price: Low to high', value: 'price_asc' },
  { label: 'Price: High to low', value: 'price_desc' },
  { label: 'Biggest discount', value: 'discount' },
  { label: 'Customer rating', value: 'rating' },
];

export const normalizeColor = color => String(color || '').trim().toLowerCase();

export const getProductColors = product => {
  const colors = Array.isArray(product.colors) ? product.colors : String(product.colors || '').split(',');
  return [...colors, ...(product.variants || []).map(variant => variant.colorName)]
    .filter(color => typeof color === 'string' && color.trim())
    .map(color => color.trim());
};

export const getCollectionColors = products => {
  const colors = new Map();
  products.forEach(product => {
    getProductColors(product).forEach(name => {
      const value = normalizeColor(name);
      const variant = product.variants?.find(item => normalizeColor(item.colorName) === value && item.colorHex);
      const swatch = variant?.colorHex || getColorDisplay(name);
      const validSwatch = globalThis.CSS?.supports('color', swatch);
      const existing = colors.get(value);
      if (!existing || variant) colors.set(value, {
        value, label: existing?.label || name,
        swatch: validSwatch ? swatch : null,
      });
    });
  });
  return [...colors.values()].sort((a, b) => a.label.localeCompare(b.label));
};

export const countActiveFilters = filters =>
  (filters.productCategory?.length || 0) + (filters.type?.length || 0) +
  (filters.color?.length || 0) + (filters.minDiscount > 0 ? 1 : 0) +
  (filters.minPrice > 0 || filters.maxPrice != null ? 1 : 0);

export const clearCollectionFilters = previous => ({ sort: previous.sort || '' });

// Apply the same filters and ordering on every collection page.
export const filterCollectionProducts = (products, filters) => {
    let result = (products || [])
      .filter((p) => {
      if (!p) return false;

      const price = Number(p.price ?? 0);
      const min = filters.minPrice ?? 0;
      const max = filters.maxPrice ?? Infinity;
      if (price < min || price > max) return false;

      if (filters.productCategory && filters.productCategory.length > 0) {
        const categoryId = p.product_category || DEFAULT_PRODUCT_CATEGORY;
        if (!filters.productCategory.includes(categoryId)) return false;
      }

      if (filters.type && filters.type.length > 0) {
        const pCategories = Array.isArray(p.categories) ? p.categories : (p.categories ? [p.categories] : []);
        const pTags = [p.type, p.session, ...pCategories].filter(Boolean);
        const hasMatch = pTags.some(tag => filters.type.includes(tag));
        if (!hasMatch) return false;
      }

      if (filters.color && filters.color.length > 0) {
        const hasMatch = getProductColors(p).some(color => filters.color.includes(normalizeColor(color)));
        if (!hasMatch) return false;
      }

      const discount = Number(p.discount ?? 0);
      if (filters.minDiscount && discount < filters.minDiscount) return false;

      return true;
    });

    if (filters.sort) {
      result.sort((a, b) => {
        switch (filters.sort) {
          case "price_asc":
            return (a.price || 0) - (b.price || 0);
          case "price_desc":
            return (b.price || 0) - (a.price || 0);
          case "discount":
            return (b.discount || 0) - (a.discount || 0);
          case "rating":
            return (b.rating || 0) - (a.rating || 0);
          case "newest":
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
          default:
            return 0;
        }
      });
    }

    return result;
};
