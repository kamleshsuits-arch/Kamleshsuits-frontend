const { chromium } = require('C:/Users/Deepak/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { spawn } = require('node:child_process');
const base = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:5176';
const ids = ['kamlesh-latest-collection-2026-09-22-suit-13', 'kamlesh-latest-collection-2026-09-22-bedsheet-01'];
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"');
const readMeta = (html, key) => decode(html.match(new RegExp(`(?:property|name)="${key}" content="([^"]+)"`))?.[1] || '');

(async () => {
  let server;
  let browser;
  try {
    if (!process.env.AUDIT_BASE_URL) {
      server = spawn(process.execPath, ['scripts/social-preview-server.mjs'], { stdio: ['ignore', 'pipe', 'inherit'], windowsHide: true });
      await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); server.once('exit', code => reject(new Error(`Preview server exited ${code}`))); });
    }
    const home = await fetch(`${base}/`);
    const html = await home.text();
    assert.equal(readMeta(html, 'og:image'), 'https://kamleshsuits.vercel.app/social/collection-v1.png');
    const homepageImage = await fetch(`${base}/social/collection-v1.png`);
    const cover = Buffer.from(await homepageImage.arrayBuffer());
    assert.equal(cover.readUInt32BE(16), 1200);
    assert.equal(cover.readUInt32BE(20), 630);
    const legacy = await fetch(`${base}/share/product/${ids[0]}`, { redirect: 'manual' });
    assert.ok([301, 302, 307, 308].includes(legacy.status));
    assert.ok(legacy.headers.get('location').endsWith(`/product/${ids[0]}`));
    for (const id of ids) {
      const path = `/product/${id}`;
      let og;
      for (const userAgent of ['WhatsApp/2.24', 'facebookexternalhit/1.1', 'Twitterbot/1.0', 'LinkedInBot/1.0', 'UnknownSocialPreview/1.0']) {
        const response = await fetch(`${base}${path}`, { headers: { 'User-Agent': userAgent } });
        const text = await response.text();
        assert.equal(response.status, 200, `${userAgent} fetches ${id}`);
        og = readMeta(text, 'og:image');
        assert.ok(og.includes(`/api/og?product=${id}`));
        assert.equal(readMeta(text, 'og:url'), `https://kamleshsuits.vercel.app${path}`);
        assert.equal((text.match(/property="og:image"/g) || []).length, 1);
        assert.equal(readMeta(text, 'og:image:width'), '1200');
        assert.equal(readMeta(text, 'product:price:amount'), id.includes('suit-13') ? '2399' : '780');
      }
      const response = await fetch(og.replace('https://kamleshsuits.vercel.app', base), { redirect: 'manual' });
      assert.equal(response.status, 200, 'Product card renders without fallback redirect');
      assert.match(response.headers.get('content-type'), /image\/png/);
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(bytes.readUInt32BE(16), 1200);
      assert.equal(bytes.readUInt32BE(20), 630);
      await fs.writeFile(`audit-results/social-live-${id.includes('suit-13') ? 'suit' : 'bedsheet'}.png`, bytes);
      console.log(JSON.stringify({ id, crawlerChecks: 5, imageBytes: bytes.length, dimensions: '1200x630', passed: true }));
    }
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await context.addInitScript(() => {
      sessionStorage.setItem('hasSeenLaunch', 'true');
      sessionStorage.setItem('kamlesh_location_prompt_seen', 'true');
      sessionStorage.setItem('kamlesh_notification_prompt_seen', 'true');
      Object.defineProperty(navigator, 'share', { value: async data => { window.__shared = data; }, configurable: true });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/product/${ids[0]}`);
    await page.getByRole('heading', { name: 'Suhaag Crimson Gold Botanical Suit Set', exact: true }).waitFor();
    assert.equal(await page.locator('meta[property="og:image"]').count(), 1);
    assert.match(await page.locator('meta[property="og:image"]').getAttribute('content'), /\/api\/og\?product=/);
    const share = page.getByRole('button', { name: /share/i }).filter({ visible: true }).first();
    await share.click();
    assert.equal(await page.evaluate(() => window.__shared?.url), `https://kamleshsuits.vercel.app/product/${ids[0]}`);
    assert.match(await page.evaluate(() => window.__shared?.text), /₹2,399/);
    await page.goto(base);
    await page.getByText('Karwa Chauth Special', { exact: true }).waitFor();
    assert.equal(await page.locator('meta[property="og:image"]').count(), 1);
    assert.equal(await page.locator('meta[property="og:image"]').getAttribute('content'), 'https://kamleshsuits.vercel.app/social/collection-v1.png');
    assert.deepEqual(errors, []);
    console.log('Browser product loading, canonical share action and single metadata tags passed.');
  } finally { await browser?.close(); server?.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
