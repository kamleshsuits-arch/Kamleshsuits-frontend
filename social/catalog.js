const API = 'https://kamleshsuits-backend.onrender.com/api';

export const validProductId = id => typeof id === 'string' && /^[\w-]{1,160}$/.test(id);

export async function fetchShareProduct(id) {
  if (!validProductId(id)) return null;
  const response = await fetch(`${API}/products/${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(8000) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Product API returned ${response.status}`);
  const product = await response.json();
  if (product.suitId !== id || !['product', 'suit'].includes(product.type) || product.active === false) return null;
  return product;
}

export function productPhoto(product) {
  let images = product.images;
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch { images = []; }
  }
  return product.image || (Array.isArray(images) ? images[0] : null) || product.variants?.find(variant => variant.images?.[0])?.images[0];
}

export async function photoDataUrl(product) {
  const raw = productPhoto(product);
  if (!raw) return null;
  const url = new URL(raw);
  // Only retrieve catalogue media from the store's own bucket; never proxy arbitrary URLs.
  if (url.protocol !== 'https:' || url.hostname !== 'kamlesh-suits-images.s3.ap-south-1.amazonaws.com') return null;
  const response = await fetch(url, { signal: AbortSignal.timeout(6000), redirect: 'error' });
  const type = response.headers.get('content-type')?.split(';')[0];
  if (!response.ok || !['image/jpeg', 'image/png', 'image/webp'].includes(type)) return null;
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > 8 * 1024 * 1024) return null;
  return `data:${type};base64,${bytes.toString('base64')}`;
}
