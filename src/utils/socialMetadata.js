export const SITE_URL = 'https://kamleshsuits.vercel.app';
export const SOCIAL_IMAGE = `${SITE_URL}/social/collection-v1.png`;
export const SOCIAL_TITLE = 'Kamlesh Suits | Beautiful Suits & Bedsheets';
export const SOCIAL_DESCRIPTION = 'Discover beautiful ladies suits, festive styles and bedsheets at Kamlesh Suits. Explore the latest arrivals, colours and prices, and find your next favourite.';
export const SOCIAL_WIDTH = 1200;
export const SOCIAL_HEIGHT = 630;
const clean = value => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value));

export const productSocialImage = product => {
  const params = new URLSearchParams({ product: product.suitId, v: product.updated_at || product.created_at || '1' });
  return `${SITE_URL}/api/og?${params}`;
};

export function productMetadata(product) {
  const title = clean(product.title || 'Explore our collection');
  const price = Number(product.price);
  const hasPrice = product.price != null && Number.isFinite(price) && price >= 0;
  const stock = Array.isArray(product.variants) && product.variants.length
    ? product.variants.reduce((sum, variant) => sum + Math.max(0, Number(variant.stock) || 0), 0)
    : Number(product.stock);
  const soldOut = Number.isFinite(stock) && stock <= 0;
  const discount = Math.round(Number(product.discount) || 0);
  const lead = [hasPrice ? money(price) : '', discount > 0 && discount < 100 ? `${discount}% off` : '', soldOut ? 'Currently sold out' : 'Explore this design'].filter(Boolean).join(' · ');
  const description = `${lead}. ${clean(product.description) || `Discover ${title} at Kamlesh Suits.`}`.slice(0, 240);
  return {
    title: `${title}${hasPrice ? ` — ${money(price)}` : ''} | Kamlesh Suits`,
    description, image: productSocialImage(product), imageAlt: `${title}${hasPrice ? `, ${money(price)}` : ''} at Kamlesh Suits`,
    url: `${SITE_URL}/product/${encodeURIComponent(product.suitId)}`, type: 'product',
    price: hasPrice ? price : null, availability: soldOut ? 'out of stock' : 'in stock',
    schema: {
      '@context': 'https://schema.org', '@type': 'Product', name: title, description,
      image: [product.image || productSocialImage(product)], sku: product.suitId,
      brand: { '@type': 'Brand', name: 'Kamlesh Suits' },
      ...(hasPrice ? { offers: { '@type': 'Offer', priceCurrency: 'INR', price,
        url: `${SITE_URL}/product/${encodeURIComponent(product.suitId)}`,
        availability: soldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition' } } : {}),
    },
  };
}

export const escapeHtml = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

export function renderSocialMetadata(metadata) {
  const tags = [];
  const meta = (attribute, key, value) => tags.push(`<meta data-rh="true" ${attribute}="${key}" content="${escapeHtml(value)}">`);
  tags.push(`<title data-rh="true">${escapeHtml(metadata.title)}</title>`);
  meta('name', 'description', metadata.description);
  meta('name', 'robots', metadata.notFound ? 'noindex, follow' : 'index, follow, max-image-preview:large');
  tags.push(`<link data-rh="true" rel="canonical" href="${escapeHtml(metadata.url)}">`);
  for (const [key, value] of Object.entries({
    'og:locale': 'en_IN', 'og:site_name': 'Kamlesh Suits', 'og:type': metadata.type || 'website',
    'og:title': metadata.title, 'og:description': metadata.description, 'og:url': metadata.url,
    'og:image': metadata.image, 'og:image:secure_url': metadata.image, 'og:image:type': 'image/png',
    'og:image:width': SOCIAL_WIDTH, 'og:image:height': SOCIAL_HEIGHT, 'og:image:alt': metadata.imageAlt,
  })) meta('property', key, value);
  for (const [key, value] of Object.entries({
    'twitter:card': 'summary_large_image', 'twitter:title': metadata.title,
    'twitter:description': metadata.description, 'twitter:image': metadata.image, 'twitter:image:alt': metadata.imageAlt,
  })) meta('name', key, value);
  if (metadata.type === 'product') {
    if (metadata.price != null) {
      meta('property', 'product:price:amount', metadata.price);
      meta('property', 'product:price:currency', 'INR');
    }
    meta('property', 'product:availability', metadata.availability);
  }
  if (metadata.schema) tags.push(`<script data-rh="true" type="application/ld+json">${JSON.stringify(metadata.schema).replaceAll('<', '\\u003c')}</script>`);
  return tags.join('\n  ');
}
