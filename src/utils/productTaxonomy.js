export const DEFAULT_PRODUCT_CATEGORY = 'suits';

// Offline fallback. The live list is loaded from /api/product-taxonomy so future
// backend additions appear without another storefront data migration.
export const FALLBACK_PRODUCT_TAXONOMY = [
  { id: 'suits', label: 'Suits', subcategories: ['Women’s Suits', 'Unstitched Suit', 'Stitched Suit', 'Dress Material'], requiresFabric: true },
  { id: 'bed-khat-sheets', label: 'Bed & Khat Sheets', subcategories: ['Bed Sheet', 'Khat Sheet'], requiresFabric: false },
  { id: 'blankets', label: 'Blankets', subcategories: ['Blanket'], requiresFabric: false },
  { id: 'pillows', label: 'Pillows', subcategories: ['Pillow', 'Pillow Cover'], requiresFabric: false },
  { id: 'dupatta', label: 'Dupatta', subcategories: ['Dupatta', 'Chundri', 'Shawl', 'Stole'], requiresFabric: false },
  { id: 'suit-inners', label: 'Suit Inners', subcategories: ['Suit Inner', 'Suit Lining'], requiresFabric: false },
  { id: 'kurta-pajama-men', label: 'Kurta Pajama (Men)', subcategories: ['Kurta Pajama'], requiresFabric: false },
  { id: 'parna', label: 'Parna', subcategories: ['Parna'], requiresFabric: false },
  { id: 'mens-unstitched', label: 'Men’s Unstitched', subcategories: ['Pant Shirt Fabric', 'Shirt Fabric', 'Pant Fabric'], requiresFabric: false },
];

export const getProductCategory = (taxonomy, categoryId) => (
  (taxonomy || FALLBACK_PRODUCT_TAXONOMY).find(category => category.id === categoryId)
);

export const getProductCategoryLabel = (product, taxonomy = FALLBACK_PRODUCT_TAXONOMY) => {
  const categoryId = product?.product_category || DEFAULT_PRODUCT_CATEGORY;
  return getProductCategory(taxonomy, categoryId)?.label || categoryId;
};
