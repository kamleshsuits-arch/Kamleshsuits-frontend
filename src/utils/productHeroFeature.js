export const createProductHeroFeature = (overrides = {}) => ({
  enabled: false,
  heroImageId: '',
  image: '',
  line_one: 'Featured piece',
  line_two: '',
  line_one_color: '#FDE68A',
  line_two_color: '#FFFFFF',
  ...overrides
});

export const normalizeProductHeroFeature = product => createProductHeroFeature({
  ...(product?.hero_feature || {}),
  enabled: Boolean(product?.hero_feature?.enabled ?? product?.featured_on_home),
  heroImageId: product?.hero_feature?.heroImageId || product?.hero_image_id || ''
});
