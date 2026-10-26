export const hasSharedStock = product => product?.inventory_mode === 'shared';

export const getColourStock = (product, variant) => hasSharedStock(product)
  ? product.stock : (variant?.stock ?? product?.stock);

export const cartQuantityLimit = product => hasSharedStock(product)
  ? Math.min(2, Math.max(0, Math.floor(Number(product.stock) || 0))) : 2;

// A catalogue collage can belong to several colours. Viewing it must not
// replace the customer's explicitly selected colour with the first variant.
export const imageColour = (variants, src) => {
  const owners = (variants || []).filter(variant => variant.images?.includes(src));
  return owners.length === 1 ? owners[0].colorName : undefined;
};
