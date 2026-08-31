export const MAX_PRODUCT_VARIANTS = 6;
export const MAX_VARIANT_IMAGES = 6;

export const createEmptyVariant = () => ({
  id: globalThis.crypto?.randomUUID?.() || `variant-${Date.now()}`,
  colorName: '',
  colorHex: '#8b5e3c',
  images: [],
  stock: 1
});

export const normalizeProductVariants = product => {
  if (Array.isArray(product?.variants) && product.variants.length) {
    return product.variants.map(variant => ({
      ...createEmptyVariant(),
      ...variant,
      id: variant.id || createEmptyVariant().id,
      images: Array.isArray(variant.images) ? variant.images.filter(Boolean) : [],
      stock: Math.max(0, Number(variant.stock) || 0)
    }));
  }

  const images = Array.isArray(product?.images) ? product.images.filter(Boolean) : (product?.image ? [product.image] : []);
  const colours = Array.isArray(product?.colors) ? product.colors.filter(Boolean) : [];
  if (!images.length && !colours.length) return [createEmptyVariant()];

  return (colours.length ? colours : ['']).map((colorName, index) => ({
    ...createEmptyVariant(),
    colorName,
    colorHex: colorName?.startsWith('#') ? colorName : '#8b5e3c',
    images: index === 0 ? images : [],
    stock: index === 0 ? Math.max(0, Number(product?.stock) || 0) : 0
  }));
};
