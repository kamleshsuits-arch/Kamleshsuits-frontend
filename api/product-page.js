import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fetchShareProduct, validProductId } from '../social/catalog.js';
import { SITE_URL, SOCIAL_IMAGE, SOCIAL_TITLE, SOCIAL_DESCRIPTION, productMetadata, renderSocialMetadata } from '../src/utils/socialMetadata.js';

const template = () => readFile(path.join(process.cwd(), 'dist/index.html'), 'utf8');

export default async function handler(req, res) {
  const id = req.query.id;
  let status = 200;
  let metadata = { title: SOCIAL_TITLE, description: SOCIAL_DESCRIPTION, image: SOCIAL_IMAGE,
    imageAlt: 'Ladies suits and bedsheets from Kamlesh Suits', url: SITE_URL, type: 'website' };
  try {
    const product = validProductId(id) ? await fetchShareProduct(id) : null;
    if (product) metadata = productMetadata(product);
    else { status = 404; metadata = { ...metadata, title: 'Product not found | Kamlesh Suits', notFound: true }; }
  } catch (error) {
    console.error('Share product lookup failed:', error.message);
    status = 503; // Ask crawlers to retry instead of caching an incorrect product preview.
    res.setHeader('Retry-After', '30');
  }
  const html = (await template()).replace(/<!-- social-meta:start -->[\s\S]*?<!-- social-meta:end -->/, `<!-- social-meta:start -->\n${renderSocialMetadata(metadata)}\n<!-- social-meta:end -->`);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', status === 200 ? 'public, max-age=0, s-maxage=300, stale-while-revalidate=600' : 'no-store');
  res.status(status).send(html);
}
