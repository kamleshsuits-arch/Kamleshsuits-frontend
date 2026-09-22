import fs from 'node:fs/promises';
import { SITE_URL, SOCIAL_IMAGE, SOCIAL_TITLE, SOCIAL_DESCRIPTION, renderSocialMetadata } from '../src/utils/socialMetadata.js';

const file = new URL('../index.html', import.meta.url);
const html = await fs.readFile(file, 'utf8');
const block = `<!-- social-meta:start -->\n  ${renderSocialMetadata({ title: SOCIAL_TITLE, description: SOCIAL_DESCRIPTION, image: SOCIAL_IMAGE, imageAlt: 'Discover beautiful ladies suits and bedsheets at Kamlesh Suits', url: SITE_URL, type: 'website' })}\n  <!-- social-meta:end -->\n  `;
const next = html.includes('<!-- social-meta:start -->')
  ? html.replace(/<!-- social-meta:start -->[\s\S]*?<!-- social-meta:end -->\s*/, block)
  : html.replace(/<title>[\s\S]*?(?=<script type="application\/ld\+json">)/, block);
if (next === html && !html.includes('<!-- social-meta:start -->')) throw new Error('Could not locate the metadata block');
await fs.writeFile(file, next.replace('<script type="application/ld+json">', '<script data-rh="true" type="application/ld+json">'));
console.log('Updated initial HTML social metadata.');
