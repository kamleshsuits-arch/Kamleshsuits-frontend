import { getColorName } from './colors';

const toHex = value => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');

const loadImage = file => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => resolve({ image, url });
  image.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error('Could not read this image'));
  };
  image.src = url;
});

// Samples the central garment area, groups nearby shades and favours colourful
// pixels so neutral studio walls do not become the detected product colour.
export const extractDominantSuitColor = async file => {
  const { image, url } = await loadImage(file);
  try {
    const size = 96;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, size, size);
    const { data } = context.getImageData(18, 8, 60, 80);
    const buckets = new Map();

    for (let index = 0; index < data.length; index += 16) {
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const alpha = data[index + 3];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max ? (max - min) / max : 0;
      const brightness = (r + g + b) / 3;
      if (alpha < 220 || brightness > 242 || brightness < 24) continue;

      const qr = Math.round(r / 24) * 24;
      const qg = Math.round(g / 24) * 24;
      const qb = Math.round(b / 24) * 24;
      const key = `${qr}-${qg}-${qb}`;
      const weight = 0.6 + saturation * 2.8 + (brightness < 225 ? 0.3 : 0);
      const bucket = buckets.get(key) || { r: 0, g: 0, b: 0, weight: 0, count: 0 };
      bucket.r += r * weight;
      bucket.g += g * weight;
      bucket.b += b * weight;
      bucket.weight += weight;
      bucket.count += 1;
      buckets.set(key, bucket);
    }

    const winner = [...buckets.values()].sort((a, b) => (b.weight * Math.log2(b.count + 1)) - (a.weight * Math.log2(a.count + 1)))[0];
    if (!winner) return { hex: '#808080', name: 'Grey' };
    const hex = `#${toHex(winner.r / winner.weight)}${toHex(winner.g / winner.weight)}${toHex(winner.b / winner.weight)}`;
    return { hex, name: getColorName(hex) };
  } finally {
    URL.revokeObjectURL(url);
  }
};
