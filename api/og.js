import { fetchShareProduct, photoDataUrl } from '../social/catalog.js';
import { renderCard } from '../social/render.js';
import { SOCIAL_IMAGE } from '../src/utils/socialMetadata.js';

export default async function handler(req, res) {
  try {
    const product = await fetchShareProduct(req.query.product);
    if (!product) { res.setHeader('Cache-Control', 'no-store'); return res.redirect(302, SOCIAL_IMAGE); }
    const image = await photoDataUrl(product);
    if (!image) { res.setHeader('Cache-Control', 'no-store'); return res.redirect(302, SOCIAL_IMAGE); }
    const response = await renderCard({ product, image });
    const bytes = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(200).send(bytes);
  } catch (error) {
    console.error('Social image unavailable:', error.message);
    res.setHeader('Cache-Control', 'no-store');
    res.redirect(302, SOCIAL_IMAGE);
  }
}
