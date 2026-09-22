import fs from 'node:fs/promises';
import path from 'node:path';
import { renderCard } from '../social/render.js';

const source = process.argv[2] || 'E:/Dasktop/AAAks/Latest_collection';
const image = `data:image/jpeg;base64,${(await fs.readFile(path.join(source, 'Set_13_01.jpeg'))).toString('base64')}`;
const secondaryImage = `data:image/jpeg;base64,${(await fs.readFile(path.join(source, 'bedsheet_01_01.jpeg'))).toString('base64')}`;
const response = await renderCard({ image, secondaryImage });
await fs.mkdir(new URL('../public/social/', import.meta.url), { recursive: true });
const bytes = Buffer.from(await response.arrayBuffer());
await fs.writeFile(new URL('../public/social/collection-v1.png', import.meta.url), bytes);
console.log(`Created 1200 × 630 collection cover (${bytes.length} bytes).`);
await fs.mkdir(new URL('../audit-results/', import.meta.url), { recursive: true });
for (const [name, photo, product] of [
  ['suit', image, { title: 'Suhaag Crimson Gold Botanical Suit Set', price: 2399, discount: 35, product_category: 'suits' }],
  ['bedsheet', secondaryImage, { title: 'Midnight Daisy Fitted Bedsheet', price: 780, discount: 15, product_category: 'bed-khat-sheets' }],
]) {
  const sample = await renderCard({ image: photo, product });
  await fs.writeFile(new URL(`../audit-results/social-${name}.png`, import.meta.url), Buffer.from(await sample.arrayBuffer()));
}
