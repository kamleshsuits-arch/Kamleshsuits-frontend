const STATIC_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const SUPPORTED_IMAGE_TYPES = new Set([...STATIC_IMAGE_TYPES, 'image/gif']);

const canvasToBlob = (canvas, type, quality) => new Promise((resolve, reject) => {
  canvas.toBlob(
    blob => blob ? resolve(blob) : reject(new Error('This browser could not optimize the image.')),
    type,
    quality
  );
});

const loadImage = async file => {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Older mobile browsers may not support the orientation option.
      return createImageBitmap(file);
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const optimizedName = name => `${name.replace(/\.[^.]+$/, '') || 'product-image'}.webp`;

export const isSupportedProductAsset = file => SUPPORTED_IMAGE_TYPES.has(file.type);

/**
 * Fast, conservative browser-side optimization.
 * Animated GIFs are returned byte-for-byte so animation and colours are preserved.
 * Static images are only replaced when the visually-lossless WebP is meaningfully smaller.
 */
export const optimizeProductAsset = async (file, options = {}) => {
  const maxDimension = options.maxDimension || 2560;
  const quality = options.quality || 0.96;

  if (!isSupportedProductAsset(file)) {
    throw new Error('Use a JPG, PNG, WebP or GIF file.');
  }

  if (file.type === 'image/gif') {
    return {
      file,
      originalSize: file.size,
      finalSize: file.size,
      optimized: false,
      note: 'GIF animation preserved'
    };
  }

  // Small files are already fast to transfer; avoid an unnecessary generation loss.
  if (file.size <= 500 * 1024) {
    return {
      file,
      originalSize: file.size,
      finalSize: file.size,
      optimized: false,
      note: 'Already optimized'
    };
  }

  const source = await loadImage(file);
  const sourceWidth = source.width || source.naturalWidth;
  const sourceHeight = source.height || source.naturalHeight;
  const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  try {
    const context = canvas.getContext('2d', { alpha: file.type !== 'image/jpeg' });
    if (!context) throw new Error('Image optimization is not supported by this browser.');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(source, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, 'image/webp', quality);
    // Keep the original unless optimization saves at least 8%; this protects quality
    // and avoids replacing an already efficient file for a negligible saving.
    if (blob.size >= file.size * 0.92) {
      return {
        file,
        originalSize: file.size,
        finalSize: file.size,
        optimized: false,
        note: 'Original kept for best quality'
      };
    }

    return {
      file: new File([blob], optimizedName(file.name), {
        type: 'image/webp',
        lastModified: Date.now()
      }),
      originalSize: file.size,
      finalSize: blob.size,
      optimized: true,
      note: scale < 1 ? 'Resized and optimized' : 'Optimized without resizing'
    };
  } finally {
    if (typeof source.close === 'function') source.close();
    canvas.width = 1;
    canvas.height = 1;
  }
};

export const formatAssetSize = bytes => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
