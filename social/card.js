import { createElement as h } from 'react';
const box = (style, ...children) => h('div', { style: { display: 'flex', ...style } }, ...children);
const photo = (src, width, height) => h('img', { src, width, height, style: { objectFit: 'contain', borderRadius: 20 } });
const ink = '#681F3B';
const gold = '#D3B17C';
const trim = (text, size) => text.length > size ? `${text.slice(0, size - 1).trim()}…` : text;

export function socialCard({ product, image, secondaryImage }) {
  const isProduct = Boolean(product);
  const price = Number(product?.price);
  const discount = Math.round(Number(product?.discount) || 0);
  const title = isProduct ? trim(product.title || 'Discover your next favourite', 92) : 'Beautiful suits.\nA home you love.';
  return box({ width: 1200, height: 630, background: '#FAF4EA', color: ink, position: 'relative', fontFamily: 'Noto Sans' },
    box({ position: 'absolute', top: 0, left: 0, width: 1200, height: 10, background: ink }),
    box({ width: isProduct ? 685 : 600, padding: '48px 46px 42px 54px', flexDirection: 'column' },
      box({ fontSize: 27, fontWeight: 700, letterSpacing: 4 }, 'KAMLESH SUITS'),
      box({ marginTop: 30, fontSize: 17, letterSpacing: 3, color: '#947249' }, isProduct ? (product.product_category === 'bed-khat-sheets' ? 'THE HOME COLLECTION' : 'THE SUIT COLLECTION') : 'STYLE FOR YOU. COMFORT FOR HOME.'),
      box({ marginTop: 18, fontSize: isProduct ? (title.length > 70 ? 43 : 49) : 61, fontWeight: 700, lineHeight: 1.12, whiteSpace: 'pre-wrap' }, title),
      isProduct
        ? box({ marginTop: 26, alignItems: 'center', gap: 22 },
          Number.isFinite(price) ? box({ fontSize: 57, fontWeight: 700 }, `₹${price.toLocaleString('en-IN')}`) : null,
          discount > 0 && discount < 100 ? box({ padding: '9px 15px', borderRadius: 25, background: ink, color: '#FFF5E2', fontSize: 21, fontWeight: 700 }, `${discount}% OFF`) : null)
        : box({ marginTop: 24, fontSize: 24, lineHeight: 1.5, color: '#786652', maxWidth: 440 }, 'Ladies suits, festive favourites and beautiful bedsheets.'),
      box({ marginTop: 'auto', flexDirection: 'column', gap: 14 },
        box({ alignItems: 'center', fontSize: 21, fontWeight: 700, color: ink }, isProduct ? 'Discover this design' : 'Explore the latest collection'),
        box({ fontSize: 17, color: '#877364' }, 'kamleshsuits.vercel.app'))),
    box({ width: isProduct ? 515 : 600, height: 630, background: ink, padding: '35px 26px', alignItems: 'center', justifyContent: 'center', gap: 14 },
      image ? box({ background: '#F2E9DC', border: `2px solid ${gold}`, borderRadius: 23, padding: 8 }, photo(image, isProduct ? 423 : 270, isProduct ? 540 : 430))
        : box({ color: gold, fontSize: 65, fontWeight: 700 }, 'KS'),
      !isProduct && secondaryImage ? box({ background: '#F2E9DC', border: `2px solid ${gold}`, borderRadius: 23, padding: 8 }, photo(secondaryImage, 220, 280)) : null));
}
