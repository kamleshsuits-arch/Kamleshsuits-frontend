export const IMAGE_WIDTHS = [96, 320, 640, 960, 1600];
export const PRODUCT_IMAGE_HOST = 'kamlesh-suits-images.s3.ap-south-1.amazonaws.com';

export function canOptimizeImage(src) {
  try {
    const url = new URL(src);
    return url.protocol === 'https:' && url.hostname === PRODUCT_IMAGE_HOST &&
      !url.search && !/\.(gif|svg)$/i.test(url.pathname);
  } catch { return false; }
}

export function optimizedImageUrl(src, width) {
  return `/_vercel/image?url=${encodeURIComponent(src)}&w=${width}&q=80`;
}

export function imageSources(src, { enabled = true, sizes = '(max-width: 767px) 50vw, 25vw', maxWidth = 960 } = {}) {
  if (!enabled || !canOptimizeImage(src)) return { src: src || undefined };
  const widths = IMAGE_WIDTHS.filter(width => width <= maxWidth);
  return {
    src: optimizedImageUrl(src, widths.at(-1)),
    srcSet: widths.map(width => `${optimizedImageUrl(src, width)} ${width}w`).join(', '),
    sizes,
  };
}
