import { readFile } from 'node:fs/promises';
import { ImageResponse } from '@vercel/og';
import { socialCard } from './card.js';

const fonts = Promise.all([
  readFile(new URL('./fonts/NotoSans-Regular.ttf', import.meta.url)),
  readFile(new URL('./fonts/NotoSans-Bold.ttf', import.meta.url)),
]);

export async function renderCard(options) {
  const [regular, bold] = await fonts;
  return new ImageResponse(socialCard(options), { width: 1200, height: 630, fonts: [
    { name: 'Noto Sans', data: regular, style: 'normal', weight: 400 },
    { name: 'Noto Sans', data: bold, style: 'normal', weight: 700 },
  ] });
}
